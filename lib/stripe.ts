import Stripe from "stripe";

let stripeClient: Stripe | null = null;

// Lazily constructed so the app can build without STRIPE_SECRET_KEY set
// (e.g. a first deploy before env vars are configured); it's only required
// once a route that actually calls Stripe is invoked.
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!stripeClient) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY is not set.");
      }
      stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-08-26.dahlia",
      });
    }
    return Reflect.get(stripeClient, prop, stripeClient);
  },
});
