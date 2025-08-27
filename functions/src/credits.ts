import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CREDIT_AMOUNTS, canPerformDailyCheckIn, isValidCreditSource } from "./utils";

const db = admin.firestore();

/**
 * HTTP function to perform daily check-in
 */
export const dailyCheckIn = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const now = new Date();
    const lastCheckIn = userData?.lastCheckinDate?.toDate();

    // Check if user can perform check-in (24 hours since last check-in)
    if (!canPerformDailyCheckIn(lastCheckIn)) {
      const nextCheckIn = new Date(lastCheckIn!.getTime() + 24 * 60 * 60 * 1000);
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Next check-in available at ${nextCheckIn.toISOString()}`
      );
    }

    // Perform check-in
    const batch = db.batch();

    // Update user credits and last check-in
    batch.update(userRef, {
      credits: admin.firestore.FieldValue.increment(CREDIT_AMOUNTS.DAILY_CHECKIN),
      lastCheckinDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create credit transaction
    const transactionRef = db.collection("creditTransactions").doc();
    batch.set(transactionRef, {
      userId,
      type: "earned",
      amount: CREDIT_AMOUNTS.DAILY_CHECKIN,
      description: "Daily check-in bonus",
      source: "checkin",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      creditsEarned: CREDIT_AMOUNTS.DAILY_CHECKIN,
      newBalance: userData.credits + CREDIT_AMOUNTS.DAILY_CHECKIN,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error performing daily check-in:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to perform check-in"
    );
  }
});

/**
 * HTTP function to spend credits
 */
export const spendCredits = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const {amount, description, source, relatedId} = data;
  const userId = context.auth.uid;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Amount must be positive"
    );
  }

  if (!source || !isValidCreditSource(source)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Valid source is required"
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userData = userDoc.data();
    const currentCredits = userData?.credits || 0;

    if (currentCredits < amount) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Insufficient credits"
      );
    }

    // Spend credits
    const batch = db.batch();

    // Update user credits
    batch.update(userRef, {
      credits: admin.firestore.FieldValue.increment(-amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create credit transaction
    const transactionRef = db.collection("creditTransactions").doc();
    batch.set(transactionRef, {
      userId,
      type: "spent",
      amount: -amount,
      description: description || "Credits spent",
      source,
      relatedId: relatedId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      creditsSpent: amount,
      newBalance: currentCredits - amount,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error spending credits:", error);
    throw new functions.https.HttpsError("internal", "Failed to spend credits");
  }
});

/**
 * HTTP function to award credits (admin only)
 */
export const awardCredits = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  // Check if user is admin
  const adminDoc = await db.collection("users").doc(context.auth.uid).get();
  const adminData = adminDoc.data();

  if (!adminData?.role || adminData.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can award credits"
    );
  }

  const {userId, amount, description, source = "admin_award", relatedId} = data;

  if (!userId || !amount || amount <= 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "User ID and positive amount required"
    );
  }

  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    // Award credits
    const batch = db.batch();

    // Update user credits
    batch.update(userRef, {
      credits: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create credit transaction
    const transactionRef = db.collection("creditTransactions").doc();
    batch.set(transactionRef, {
      userId,
      type: "earned",
      amount,
      description: description || "Credits awarded by admin",
      source,
      relatedId: relatedId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return {
      success: true,
      creditsAwarded: amount,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    functions.logger.error("Error awarding credits:", error);
    throw new functions.https.HttpsError("internal", "Failed to award credits");
  }
});

/**
 * Internal function to award credits (for system use)
 */
export const awardCreditsInternal = async (
  userId: string,
  amount: number,
  description: string,
  source: string,
  relatedId?: string
) => {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  // Award credits
  const batch = db.batch();

  // Update user credits
  batch.update(userRef, {
    credits: admin.firestore.FieldValue.increment(amount),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create credit transaction
  const transactionRef = db.collection("creditTransactions").doc();
  batch.set(transactionRef, {
    userId,
    type: "earned",
    amount,
    description,
    source,
    relatedId: relatedId || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    success: true,
    creditsAwarded: amount,
  };
};

/**
 * HTTP function to get credit history
 */
export const getCreditHistory = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;
    const {limit = 50, startAfter} = data;

    try {
      let query = db
        .collection("creditTransactions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit);

      if (startAfter) {
        const startAfterDoc = await db
          .collection("creditTransactions")
          .doc(startAfter)
          .get();
        query = query.startAfter(startAfterDoc);
      }

      const snapshot = await query.get();
      const transactions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        transactions,
        hasMore: snapshot.docs.length === limit,
        lastDoc: snapshot.docs.length > 0 ?
          snapshot.docs[snapshot.docs.length - 1].id : null,
      };
    } catch (error) {
      functions.logger.error("Error getting credit history:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get credit history"
      );
    }
  }
);