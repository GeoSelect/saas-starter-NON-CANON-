// CCP-05 Stripe Webhook Handler
// POST /api/webhooks/stripe
// Receives Stripe events (subscription.updated, customer.subscription.deleted)
// Updates local billing_state → triggers entitlement sync → invalidates cache

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { syncBillingStateFromStripe, invalidateWorkspaceCache } from '@/lib/services/entitlements';
import type { SubscriptionTier } from '@/lib/contracts/ccp05/entitlements';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Helper: Map Stripe plan name to internal tier
 * Assumes Stripe product names match tier names (free, pro, pro_plus, etc)
 */
function mapStripePriceToTier(priceId: string): SubscriptionTier | null {
  const tierMap: Record<string, SubscriptionTier> = {
    'price_free': 'free',
    'price_pro': 'pro',
    'price_pro_plus': 'pro_plus',
    'price_portfolio': 'portfolio',
    'price_enterprise': 'enterprise',
  };

  return tierMap[priceId] || null;
}

/**
 * Handle subscription.updated event
 * Updates billing_state when customer changes subscription tier or status
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServerClient>
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status as 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';

  // Determine tier from subscription items
  const item = subscription.items.data[0];
  const priceId = item?.price.id || '';
  const tier = mapStripePriceToTier(priceId) || 'free';

  // Extract trial end if in trialing period
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

  // Find workspace by Stripe customer ID
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!workspace) {
    console.warn(`[stripe-webhook] No workspace found for customer ${customerId}`);
    return;
  }

  // Update billing_state (this triggers sync_entitlements_from_billing)
  const { error: updateError } = await supabase
    .from('billing_state')
    .upsert(
      {
        workspace_id: workspace.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        tier,
        status,
        trial_end: trialEnd,
        synced_at: new Date().toISOString(),
      },
      {
        onConflict: 'workspace_id',
      }
    );

  if (updateError) {
    console.error(`[stripe-webhook] Error updating billing_state:`, updateError);
    throw new Error('Failed to update billing state');
  }

  console.log(`[stripe-webhook] Updated billing for workspace ${workspace.id} (tier: ${tier}, status: ${status})`);

  // Invalidate cache (redundant with DB trigger, but ensures consistency)
  await invalidateWorkspaceCache(workspace.id);
}

/**
 * Handle customer.subscription.deleted event
 * Marks subscription as cancelled and denies all tier-gated features
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createServerClient>
) {
  const customerId = subscription.customer as string;

  // Find workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!workspace) {
    console.warn(`[stripe-webhook] No workspace found for deleted subscription (customer: ${customerId})`);
    return;
  }

  // Set tier to free, status to cancelled
  const { error: updateError } = await supabase
    .from('billing_state')
    .upsert(
      {
        workspace_id: workspace.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        tier: 'free',
        status: 'cancelled',
        synced_at: new Date().toISOString(),
      },
      {
        onConflict: 'workspace_id',
      }
    );

  if (updateError) {
    console.error(`[stripe-webhook] Error updating billing on deletion:`, updateError);
    throw new Error('Failed to update billing state');
  }

  console.log(`[stripe-webhook] Cancelled subscription for workspace ${workspace.id}`);

  // Invalidate cache
  await invalidateWorkspaceCache(workspace.id);
}

/**
 * Handle checkout.session.completed event
 * Processes HOA packet purchases and upgrades users to basic_buyer
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    const { parcelId, propertyAddress, propertyCity, propertyState, propertyZip } = session.metadata || {};
    const customerEmail = session.customer_email;

    if (!parcelId || !customerEmail) {
      console.warn('[stripe-webhook] Missing parcelId or customerEmail in session metadata');
      return;
    }

    // 1. Store transaction in database
    const { data: purchase, error: purchaseError } = await supabase
      .from('hoa_packet_purchases')
      .insert([
        {
          parcel_id: parcelId,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent,
          amount_cents: session.amount_total,
          currency: session.currency,
          customer_email: customerEmail,
          property_address: propertyAddress,
          property_city: propertyCity,
          property_state: propertyState,
          property_zip: propertyZip,
          status: 'completed',
          metadata: { sessionId: session.id },
        },
      ])
      .select()
      .single();

    if (purchaseError) {
      console.error('[stripe-webhook] Failed to store purchase:', purchaseError);
      return;
    }

    // 2. Find or create user with this email
    let userId: string;
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user account (guest checkout)
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert([
          {
            email: customerEmail,
            subscription_tier: 'basic_buyer',
            role: 'user',
            onboarding_completed: false,
          },
        ])
        .select('id')
        .single();

      if (createUserError) {
        console.error('[stripe-webhook] Failed to create user:', createUserError);
        return;
      }

      userId = newUser.id;
    }

    // 3. Update user to basic_buyer if not already
    const { error: updateError } = await supabase
      .from('users')
      .update({ subscription_tier: 'basic_buyer', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('[stripe-webhook] Failed to upgrade user:', updateError);
      return;
    }

    // 4. Grant access to this parcel
    const { error: accessError } = await supabase
      .from('user_hoa_packet_access')
      .upsert([
        {
          user_id: userId,
          parcel_id: parcelId,
          purchase_id: purchase.id,
          access_level: 'full',
        },
      ]);

    if (accessError) {
      console.error('[stripe-webhook] Failed to grant access:', accessError);
      return;
    }

    // 5. Update purchase with user_id
    await supabase
      .from('hoa_packet_purchases')
      .update({ user_id: userId })
      .eq('id', purchase.id);

    console.log(`[stripe-webhook] ✓ HOA packet purchased: ${purchase.id} for user ${userId} (parcel: ${parcelId})`);
  } catch (error) {
    console.error('[stripe-webhook] Error handling checkout.session.completed:', error);
    throw error;
  }
}

/**
 * Handle charge.refunded event
 * Marks purchase as refunded but keeps access (optional: revoke access)
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  supabase: ReturnType<typeof createServerClient>
) {
  try {
    const paymentIntentId = charge.payment_intent as string;

    if (!paymentIntentId) {
      console.warn('[stripe-webhook] Missing payment_intent in charge');
      return;
    }

    const { error: refundError } = await supabase
      .from('hoa_packet_purchases')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (refundError) {
      console.error('[stripe-webhook] Failed to mark as refunded:', refundError);
      return;
    }

    console.log(`[stripe-webhook] ✓ Purchase refunded for payment_intent: ${paymentIntentId}`);
  } catch (error) {
    console.error('[stripe-webhook] Error handling charge.refunded:', error);
    throw error;
  }
}

/**
 * POST /api/webhooks/stripe
 *
 * Stripe sends webhook events here
 * Verifies signature, routes to handler based on event type
 */
export async function POST(req: NextRequest) {
  try {
    // === Verify Signature ===
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[stripe-webhook] Signature verification failed:`, errorMessage);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      );
    }

    console.log(`[stripe-webhook] Received event: ${event.type}`);

    // === Initialize Supabase ===
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // In middleware
            }
          },
        },
      }
    );

    // === Route Event ===
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge, supabase);
        break;

      default:
        console.log(`[stripe-webhook] Ignoring event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[stripe-webhook] Unhandled error:', errorMessage);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    );
  }
}
