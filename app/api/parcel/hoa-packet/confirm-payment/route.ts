import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId, parcelId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const customerEmail = session.customer_email || '';

    // TODO: In production, you would:
    // 1. Store transaction in database (supabase)
    // 2. Upgrade user to 'basic_buyer' role
    // 3. Generate downloadable HOA packet
    // 4. Send confirmation email with download link

    // For now, return a mock download link
    const downloadLink = `/api/parcel/hoa-packet/download?sessionId=${sessionId}&parcelId=${parcelId}`;

    return NextResponse.json({
      sessionId,
      status: session.payment_status,
      amount: session.amount_total,
      currency: session.currency,
      customerEmail,
      parcelId,
      downloadLink,
    });
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Payment confirmation failed',
      },
      { status: 500 }
    );
  }
}
