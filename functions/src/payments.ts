import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

const db = admin.firestore();
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});

// Credit packages configuration
const CREDIT_PACKAGES = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    price: 199, // $1.99 in cents
    credits: 100,
    bonusCredits: 0,
  },
  popular: {
    id: "popular",
    name: "Popular Pack",
    price: 999, // $9.99 in cents
    credits: 500,
    bonusCredits: 50,
  },
  creator: {
    id: "creator",
    name: "Creator Pack",
    price: 4999, // $49.99 in cents
    credits: 2500,
    bonusCredits: 400,
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    price: 9999, // $99.99 in cents
    credits: 5000,
    bonusCredits: 1000,
  },
};

/**
 * HTTP function to create payment intent
 */
export const createPaymentIntent = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {packageId} = data;
    const userId = context.auth.uid;

    if (!packageId || !CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid package ID"
      );
    }

    const creditPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES];

    try {
      // Get user data
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: creditPackage.price,
        currency: "usd",
        metadata: {
          userId,
          packageId,
          credits: creditPackage.credits.toString(),
          bonusCredits: creditPackage.bonusCredits.toString(),
        },
        receipt_email: userData?.email,
      });

      // Create payment record
      await db.collection("payments").doc(paymentIntent.id).set({
        userId,
        stripePaymentIntentId: paymentIntent.id,
        packageId,
        amount: creditPackage.price,
        credits: creditPackage.credits,
        bonusCredits: creditPackage.bonusCredits,
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      functions.logger.error("Error creating payment intent:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to create payment intent"
      );
    }
  }
);

/**
 * HTTP function to handle Stripe webhooks
 */
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    functions.logger.error("Webhook signature verification failed:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  functions.logger.info(`Received webhook event: ${event.type}`);

  try {
    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        functions.logger.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    functions.logger.error("Error processing webhook:", error);
    res.status(500).send("Webhook processing failed");
  }
});

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const {userId, packageId, credits, bonusCredits} = paymentIntent.metadata;

  if (!userId || !packageId || !credits) {
    functions.logger.error("Missing metadata in payment intent");
    return;
  }

  try {
    const batch = db.batch();

    // Update payment status
    const paymentRef = db.collection("payments").doc(paymentIntent.id);
    batch.update(paymentRef, {
      status: "succeeded",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Calculate total credits
    const totalCredits = parseInt(credits) + parseInt(bonusCredits || "0");

    // Update user credits
    const userRef = db.collection("users").doc(userId);
    batch.update(userRef, {
      credits: admin.firestore.FieldValue.increment(totalCredits),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create credit transaction
    const transactionRef = db.collection("creditTransactions").doc();
    batch.set(transactionRef, {
      userId,
      type: "earned",
      amount: totalCredits,
      description: `Purchased ${CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]?.name || packageId}`,
      source: "purchase",
      relatedId: paymentIntent.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    functions.logger.info(`Payment successful for user ${userId}: ${totalCredits} credits`);
  } catch (error) {
    functions.logger.error("Error handling payment success:", error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment status
    await db.collection("payments").doc(paymentIntent.id).update({
      status: "failed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Payment failed for payment intent ${paymentIntent.id}`);
  } catch (error) {
    functions.logger.error("Error handling payment failure:", error);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment status
    await db.collection("payments").doc(paymentIntent.id).update({
      status: "canceled",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Payment canceled for payment intent ${paymentIntent.id}`);
  } catch (error) {
    functions.logger.error("Error handling payment cancellation:", error);
  }
}

/**
 * HTTP function to get payment history
 */
export const getPaymentHistory = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const {limit = 20, startAfter} = data;

    try {
      let query = db
        .collection("payments")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (startAfter) {
        const startAfterDoc = await db
          .collection("payments")
          .doc(startAfter)
          .get();
        query = query.startAfter(startAfterDoc);
      }

      const snapshot = await query.get();
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        payments,
        hasMore: snapshot.docs.length === limit,
        lastDoc: snapshot.docs.length > 0 ?
          snapshot.docs[snapshot.docs.length - 1].id : null,
      };
    } catch (error) {
      functions.logger.error("Error getting payment history:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get payment history"
      );
    }
  }
);