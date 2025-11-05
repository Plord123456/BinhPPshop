import { Router } from "express";
import stripe from "../lib/stripe.js";
const router = Router();

router.post("/checkout", async (req, res) => {
  const { email, price, order_id: orderId } = req.body;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  if (typeof price !== "number" || Number.isNaN(price) || price <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid price",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const amountInCents = Math.round(price * 100);

  try {
    const customer = await stripe.customers.create({
      email: normalizedEmail,
      metadata: orderId ? { latest_order_id: String(orderId) } : {},
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-06-20" }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: normalizedEmail,
      description: `Order from ${normalizedEmail}`,
      metadata: {
        order_id: orderId ?? "",
        email: normalizedEmail,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Payment session created successfully",
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      paymentIntent: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;