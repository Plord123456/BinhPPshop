import { Router } from "express";
import supabase from "../lib/supabase.js";

const router = Router();

/**
 * GET /orders/:orderId/payment-status
 * Check payment status for an order
 */
router.get("/:orderId/payment-status", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Query order from Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, payment_status, payment_method, vnpay_transaction_no")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      isPaid: order.payment_status === "paid",
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method || null,
      transactionNo: order.vnpay_transaction_no || null,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

/**
 * GET /orders/:orderId
 * Get order details
 */
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Query order from Supabase
    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;

