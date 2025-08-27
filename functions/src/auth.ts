import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {generateReferralCode, CREDIT_AMOUNTS} from "./utils";

const db = admin.firestore();

/**
 * Triggered when a new user is created
 * Creates user document with initial credits and referral code
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const userData = {
      email: user.email,
      displayName: user.displayName || "User",
      photoURL: user.photoURL,
      credits: CREDIT_AMOUNTS.SIGNUP_BONUS,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      referralCode: generateReferralCode(user.uid),
      isFirstVideoGenerated: false,
    };

    // Create user document
    await db.collection("users").doc(user.uid).set(userData);

    // Create signup bonus transaction
    await db.collection("creditTransactions").add({
      userId: user.uid,
      type: "earned",
      amount: CREDIT_AMOUNTS.SIGNUP_BONUS,
      description: "Welcome bonus for new account",
      source: "signup",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User created: ${user.uid}`);
  } catch (error) {
    functions.logger.error("Error creating user:", error);
  }
});

/**
 * Triggered when a user is deleted
 * Cleans up user-related data
 */
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    const batch = db.batch();

    // Delete user document
    batch.delete(db.collection("users").doc(user.uid));

    // Delete user's credit transactions
    const creditTransactions = await db
      .collection("creditTransactions")
      .where("userId", "==", user.uid)
      .get();

    creditTransactions.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's video creations
    const videoCreations = await db
      .collection("videoCreations")
      .where("userId", "==", user.uid)
      .get();

    videoCreations.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete user's payments
    const payments = await db
      .collection("payments")
      .where("userId", "==", user.uid)
      .get();

    payments.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    functions.logger.info(`User deleted: ${user.uid}`);
  } catch (error) {
    functions.logger.error("Error deleting user data:", error);
  }
});

/**
 * HTTP function to update user profile
 */
export const updateUserProfile = functions.https.onCall(
  async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {displayName} = data;
    const userId = context.auth.uid;

    try {
      await db.collection("users").doc(userId).update({
        displayName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {success: true};
    } catch (error) {
      functions.logger.error("Error updating user profile:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to update profile"
      );
    }
  }
);

/**
 * HTTP function to get user data
 */
export const getUserData = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const userId = context.auth.uid;

  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    return {
      id: userId,
      ...userDoc.data(),
    };
  } catch (error) {
    functions.logger.error("Error getting user data:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to get user data"
    );
  }
});