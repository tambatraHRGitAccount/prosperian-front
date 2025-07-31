// config/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const fallbackKey = "pk_test_51RqTHy9ngvtcjWJfJxILY6Tp7Yqn0AS534pJIrQ2QbnznazctiI20jA4pM6PVF9KIO5D6EqwohQpZYUKxvyEDCZf00aR1RL2eu";

const stripePublishableKey = key && key.startsWith('pk_') ? key : fallbackKey;

export const stripePromise = loadStripe(stripePublishableKey);

export const getStripe = async () => {
  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error('Stripe n\'a pas pu être initialisé');
  }
  return stripe;
};
