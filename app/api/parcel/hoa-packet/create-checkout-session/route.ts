import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const { parcelId, property, priceInCents } = await req.json();

    if (!parcelId || !priceInCents) {
      return NextResponse.json(
        { error: 'Missing parcelId or priceInCents' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HOA Packet - ${property?.address || 'Property'}`,
              description: `Complete HOA documentation and property assessment for parcel ${parcelId}`,
              images: ['https://via.placeholder.com/400x400?text=HOA+Packet'],
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN}/parcel/hoa-packet/success?session_id={CHECKOUT_SESSION_ID}&parcelId=${parcelId}`,
      cancel_url: `${DOMAIN}/parcel/hoa-packet?id=${parcelId}`,
      // Store parcel info in metadata for webhook processing
      metadata: {
        parcelId,
        propertyAddress: property?.address || '',
        propertyCity: property?.city || '',
        propertyState: property?.state || '',
        propertyZip: property?.zip || '',
      },
      customer_email: '', // Will be collected during checkout
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
