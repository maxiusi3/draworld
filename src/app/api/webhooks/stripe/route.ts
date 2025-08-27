import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const CREDIT_PACKAGES = {
  starter: { credits: 100, bonusCredits: 0, name: 'Starter Pack' },
  popular: { credits: 500, bonusCredits: 50, name: 'Popular Pack' },
  creator: { credits: 2500, bonusCredits: 400, name: 'Creator Pack' },
  pro: { credits: 5000, bonusCredits: 1000, name: 'Pro Pack' },
};

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`Received webhook event: ${event.type}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { userId, packageId, credits, bonusCredits } = paymentIntent.metadata;

  if (!userId || !packageId || !credits) {
    console.error('Missing metadata in payment intent');
    return;
  }

  try {
    const batch = db.batch();

    // Update payment status
    const paymentRef = db.collection('payments').doc(paymentIntent.id);
    batch.update(paymentRef, {
      status: 'succeeded',
      updatedAt: new Date(),
    });

    // Calculate total credits
    const totalCredits = parseInt(credits) + parseInt(bonusCredits || '0');

    // Update user credits
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const currentCredits = userDoc.data()?.credits || 0;
    
    batch.update(userRef, {
      credits: currentCredits + totalCredits,
      updatedAt: new Date(),
    });

    // Create credit transaction
    const transactionRef = db.collection('creditTransactions').doc();
    batch.set(transactionRef, {
      userId,
      type: 'earned',
      amount: totalCredits,
      description: `Purchased ${CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]?.name || packageId}`,
      source: 'purchase',
      relatedId: paymentIntent.id,
      createdAt: new Date(),
    });

    await batch.commit();

    console.log(`Payment successful for user ${userId}: ${totalCredits} credits`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    await db.collection('payments').doc(paymentIntent.id).update({
      status: 'failed',
      updatedAt: new Date(),
    });

    console.log(`Payment failed for payment intent ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    await db.collection('payments').doc(paymentIntent.id).update({
      status: 'canceled',
      updatedAt: new Date(),
    });

    console.log(`Payment canceled for payment intent ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}