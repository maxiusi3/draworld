import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * HTTP function to process referral signup
 */
export const processReferralSignup = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {referralCode} = data;
    const newUserId = context.auth.uid;

    if (!referralCode) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Referral code is required"
      );
    }

    try {
      // Find referrer by referral code
      const referrerQuery = await db
        .collection("users")
        .where("referralCode", "==", referralCode)
        .limit(1)
        .get();

      if (referrerQuery.empty) {
        throw new functions.https.HttpsError(
          "not-found",
          "Invalid referral code"
        );
      }

      const referrerDoc = referrerQuery.docs[0];
      const referrerId = referrerDoc.id;

      // Check if referral already exists
      const existingReferral = await db
        .collection("referrals")
        .where("referredUserId", "==", newUserId)
        .limit(1)
        .get();

      if (!existingReferral.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "User already has a referral"
        );
      }

      const batch = db.batch();

      // Create referral record
      const referralRef = db.collection("referrals").doc();
      batch.set(referralRef, {
        referrerId,
        referredUserId: newUserId,
        signupBonusAwarded: true,
        firstVideoBonusAwarded: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Award bonus credits to new user (friend)
      const newUserRef = db.collection("users").doc(newUserId);
      batch.update(newUserRef, {
        credits: admin.firestore.FieldValue.increment(50), // REFERRAL_FRIEND_BONUS
        referredBy: referrerId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Award credits to referrer
      const referrerRef = db.collection("users").doc(referrerId);
      batch.update(referrerRef, {
        credits: admin.firestore.FieldValue.increment(30), // REFERRAL_SIGNUP
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create credit transactions
      const friendTransactionRef = db.collection("creditTransactions").doc();
      batch.set(friendTransactionRef, {
        userId: newUserId,
        type: "bonus",
        amount: 50,
        description: "Referral signup bonus",
        relatedId: referralRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const referrerTransactionRef = db.collection("creditTransactions").doc();
      batch.set(referrerTransactionRef, {
        userId: referrerId,
        type: "earned",
        amount: 30,
        description: "Referral signup reward",
        relatedId: referralRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      return {
        success: true,
        friendBonus: 50,
        referrerBonus: 30,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      functions.logger.error("Error processing referral signup:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to process referral"
      );
    }
  }
);

/**
 * Triggered when a video creation is completed
 * Awards first video bonus to referrer if applicable
 */
export const onFirstVideoCreated = functions.firestore
  .document("videoCreations/{videoId}")
  .onCreate(async (snap, context) => {
    const videoData = snap.data();
    const userId = videoData.userId;

    try {
      // Check if this is the user's first video
      const userVideos = await db
        .collection("videoCreations")
        .where("userId", "==", userId)
        .where("status", "==", "completed")
        .get();

      if (userVideos.size !== 1) {
        // Not the first video
        return;
      }

      // Check if user was referred and first video bonus not yet awarded
      const referralQuery = await db
        .collection("referrals")
        .where("referredUserId", "==", userId)
        .where("firstVideoBonusAwarded", "==", false)
        .limit(1)
        .get();

      if (referralQuery.empty) {
        // No pending referral bonus
        return;
      }

      const referralDoc = referralQuery.docs[0];
      const referralData = referralDoc.data();
      const referrerId = referralData.referrerId;

      const batch = db.batch();

      // Mark first video bonus as awarded
      batch.update(referralDoc.ref, {
        firstVideoBonusAwarded: true,
      });

      // Award credits to referrer
      const referrerRef = db.collection("users").doc(referrerId);
      batch.update(referrerRef, {
        credits: admin.firestore.FieldValue.increment(70), // REFERRAL_FIRST_VIDEO
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create credit transaction
      const transactionRef = db.collection("creditTransactions").doc();
      batch.set(transactionRef, {
        userId: referrerId,
        type: "earned",
        amount: 70,
        description: "Referral first video bonus",
        relatedId: referralDoc.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      functions.logger.info(`First video bonus awarded to referrer ${referrerId}`);
    } catch (error) {
      functions.logger.error("Error processing first video bonus:", error);
    }
  });

/**
 * HTTP function to get referral stats
 */
export const getReferralStats = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const userId = context.auth.uid;

    try {
      // Get user's referral code
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();
      const referralCode = userData?.referralCode;

      // Get referral statistics
      const referralsQuery = await db
        .collection("referrals")
        .where("referrerId", "==", userId)
        .get();

      const referrals = referralsQuery.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const totalReferrals = referrals.length;
      const completedReferrals = referrals.filter(
        (ref) => ref.firstVideoBonusAwarded
      ).length;

      // Calculate total earnings from referrals
      const signupEarnings = totalReferrals * 30; // REFERRAL_SIGNUP
      const videoEarnings = completedReferrals * 70; // REFERRAL_FIRST_VIDEO
      const totalEarnings = signupEarnings + videoEarnings;

      return {
        referralCode,
        totalReferrals,
        completedReferrals,
        totalEarnings,
        referrals,
      };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      functions.logger.error("Error getting referral stats:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to get referral stats"
      );
    }
  }
);