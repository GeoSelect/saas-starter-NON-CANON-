import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { normalizeParcelRef, generateIdempotencyKey, type ParcelRef } from '@/lib/hoa-packet';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';
const SKU = 'hoa_packet_v1';

/**
 * POST /api/parcel/hoa-packet/checkout
 * 
 * Create Stripe checkout session for HOA packet purchase
 * Request body:
 * {
 *   "parcel_ref": { "parcel_id": "40023" } | { "apn": "...", "jurisdiction": "..." },
 *   "workspace_id": "optional",
 *   "customer_email": "optional",
 *   "success_url": "...",
 *   "cancel_url": "..."
 * }
 * 
 * Returns:
 * {
 *   "checkout_url": "https://checkout.stripe.com/...",
 *   "session_id": "cs_test_..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const {
      parcel_ref: parcelRefInput,
      workspace_id,
      customer_email,
      success_url,
      cancel_url,
    } = await req.json();

    // === Validate input ===
    if (!parcelRefInput) {
      return NextResponse.json(
        { error: 'Missing parcel_ref' },
        { status: 400 }
      );
    }

    // === Normalize parcel ref ===
    let parcelRef: string;
    try {
      parcelRef = normalizeParcelRef(parcelRefInput as ParcelRef);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid parcel_ref format' },
        { status: 400 }
      );
    }

    // === Get current user (if authenticated) ===
    let userId: string | null = null;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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

    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        userId = data.user.id;
      }
    } catch (err) {
      // User not authenticated
    }

    // === Generate idempotency key ===
    const idempotencyKey = generateIdempotencyKey(userId, parcelRef, SKU);

    // === Check if session already exists for this key ===
    // (For production, store idempotency keys in DB or cache)
    // For now, always create new session but in real scenario:
    // const existing = await redis.get(`idempotency:${idempotencyKey}`);
    // if (existing) return existing session

    // === Rate limiting (IP + account_id) ===
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = userId ? `${userId}:checkout` : `${clientIp}:checkout`;
    // TODO: Implement actual rate limiting
    // const limited = await checkRateLimit(rateLimitKey);
    // if (limited) return { status: 429, error: 'Too many requests' }

    // === Create Stripe checkout session ===
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HOA Packet - ${parcelRef}`,
              description: `Complete HOA documentation and property assessment for ${parcelRef}`,
              images: ['https://via.placeholder.com/400x400?text=HOA+Packet'],
            },
            unit_amount: 3900, // $39.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${DOMAIN}/parcel/hoa-packet/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${DOMAIN}/parcel/hoa-packet?parcel_ref=${encodeURIComponent(parcelRef)}`,
      // === Metadata for webhook processing ===
      metadata: {
        purchase_type: 'hoa_packet',
        parcel_ref, // normalized format
        account_id: userId || '',
        workspace_id: workspace_id || '',
        sku: SKU,
        environment: process.env.NODE_ENV || 'development',
        idempotency_key: idempotencyKey,
      },
      customer_email: customer_email || '', // Will be collected during checkout
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to generate checkout URL' },
        { status: 500 }
      );
    }

    console.log(
      `[/checkout] ✓ Created session ${session.id} for ${parcelRef} (user: ${userId || 'guest'})`
    );

    return NextResponse.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[/checkout] Error:', message);

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
