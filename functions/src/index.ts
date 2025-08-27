import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Stripe
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2024-06-20",
});

// Export all functions
export * from "./auth";
export * from "./credits";
export * from "./payments";
export * from "./referrals";
export * from "./analytics";