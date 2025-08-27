import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Server-side Stripe (for API routes)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Credit packages configuration
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 199, // $1.99 in cents
    credits: 100,
    bonusCredits: 0,
    popular: false,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    price: 999, // $9.99 in cents
    credits: 500,
    bonusCredits: 50,
    popular: true,
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    price: 4999, // $49.99 in cents
    credits: 2500,
    bonusCredits: 400,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    price: 9999, // $99.99 in cents
    credits: 5000,
    bonusCredits: 1000,
    popular: false,
  },
] as const;