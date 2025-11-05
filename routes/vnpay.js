import { Router } from "express";
import {
  createPaymentUrl,
  verifyReturnUrl,
  verifyIpnCall,
  getResponseDescription,
} from "../lib/vnpay.js";

const router = Router();

/**
 * Create VNPAY payment URL
 * POST /vnpay/create-payment-url
 */
router.post("/create-payment-url", (req, res) => {
  try {
    const {
      orderId,
      amount,
      orderDescription,
      orderType,
      locale,
      bankCode,
    } = req.body;

    console.log("📝 VNPAY Payment Request:", {
      orderId,
      amount,
      orderDescription,
      orderType,
      locale,
      bankCode,
    });

    // Validation
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    // Sanitize orderId: VNPAY requires alphanumeric only (no special chars)
    // Format: Add timestamp to ensure uniqueness within the day
    const timestamp = Date.now();
    const sanitizedOrderId = String(orderId).replace(/[^a-zA-Z0-9]/g, "") + timestamp;
    
    console.log("🔧 Sanitized Order ID:", {
      original: orderId,
      sanitized: sanitizedOrderId,
    });

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!orderDescription) {
      return res.status(400).json({
        success: false,
        message: "Order description is required",
      });
    }
    
    // Sanitize orderDescription: Remove Vietnamese accents and special chars
    const sanitizedDescription = orderDescription
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special chars
      .trim();

    // Get client IP address
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    console.log("🌐 Client IP:", ipAddr);

    // Create payment URL with sanitized data
    const paymentUrl = createPaymentUrl({
      orderId: sanitizedOrderId,
      amount,
      orderDescription: sanitizedDescription,
      orderType: orderType || "other",
      locale: locale || "vn",
      ipAddr,
      bankCode: bankCode || "",
    });

    console.log("✅ Payment URL created successfully");
    console.log("🔗 URL length:", paymentUrl.length);

    return res.status(200).json({
      success: true,
      message: "Payment URL created successfully",
      paymentUrl,
      orderId: sanitizedOrderId,
      originalOrderId: orderId,
    });
  } catch (error) {
    console.error("❌ Error creating VNPAY payment URL:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * VNPAY Return URL handler
 * This is called when user completes payment and is redirected back
 * GET /vnpay/return
 */
router.get("/return", (req, res) => {
  try {
    const vnpParams = req.query;
    const isValid = verifyReturnUrl(vnpParams);

    if (isValid) {
      const orderId = vnpParams["vnp_TxnRef"];
      const amount = vnpParams["vnp_Amount"] / 100;
      const orderInfo = vnpParams["vnp_OrderInfo"];
      const responseCode = vnpParams["vnp_ResponseCode"];
      const transactionNo = vnpParams["vnp_TransactionNo"];
      const bankCode = vnpParams["vnp_BankCode"];
      const payDate = vnpParams["vnp_PayDate"];

      if (responseCode === "00") {
        // Payment successful
        // Here you should update your database
        // For now, we'll redirect to a success page or return JSON

        return res.status(200).json({
          success: true,
          message: "Payment successful",
          data: {
            orderId,
            amount,
            orderInfo,
            transactionNo,
            bankCode,
            payDate,
            responseCode,
            description: getResponseDescription(responseCode),
          },
        });
      } else {
        // Payment failed
        return res.status(400).json({
          success: false,
          message: "Payment failed",
          data: {
            orderId,
            amount,
            orderInfo,
            responseCode,
            description: getResponseDescription(responseCode),
          },
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }
  } catch (error) {
    console.error("Error processing VNPAY return:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * VNPAY IPN (Instant Payment Notification) handler
 * This is called by VNPAY server to notify payment status
 * GET /vnpay/ipn
 */
router.get("/ipn", async (req, res) => {
  try {
    const vnpParams = req.query;
    const verification = verifyIpnCall(vnpParams);

    if (!verification.isValidSignature) {
      return res.status(200).json({
        RspCode: "97",
        Message: "Invalid signature",
      });
    }

    const {
      orderId,
      rspCode,
      amount,
      bankCode,
      cardType,
      orderInfo,
      payDate,
      transactionNo,
    } = verification;

    // TODO: Check if this order exists in your database
    // const order = await checkOrderExists(orderId);
    // if (!order) {
    //   return res.status(200).json({
    //     RspCode: "01",
    //     Message: "Order not found",
    //   });
    // }

    // TODO: Check if this order has been updated before
    // const isAlreadyUpdated = await checkOrderStatus(orderId);
    // if (isAlreadyUpdated) {
    //   return res.status(200).json({
    //     RspCode: "02",
    //     Message: "Order already updated",
    //   });
    // }

    // TODO: Verify amount matches the order amount
    // if (order.amount !== amount) {
    //   return res.status(200).json({
    //     RspCode: "04",
    //     Message: "Invalid amount",
    //   });
    // }

    // Payment successful
    if (rspCode === "00") {
      // TODO: Update order status in database
      // await updateOrderStatus(orderId, {
      //   status: "paid",
      //   paymentMethod: "vnpay",
      //   transactionNo,
      //   bankCode,
      //   cardType,
      //   payDate,
      // });

      console.log("✅ Payment successful for order:", orderId);
      console.log("Transaction details:", {
        orderId,
        amount,
        transactionNo,
        bankCode,
        cardType,
        payDate,
      });

      return res.status(200).json({
        RspCode: "00",
        Message: "Success",
      });
    } else {
      // Payment failed
      // TODO: Update order status to failed
      // await updateOrderStatus(orderId, {
      //   status: "failed",
      //   responseCode: rspCode,
      // });

      console.log("❌ Payment failed for order:", orderId);
      console.log("Response code:", rspCode);

      return res.status(200).json({
        RspCode: "00",
        Message: "Success",
      });
    }
  } catch (error) {
    console.error("Error processing VNPAY IPN:", error);
    return res.status(200).json({
      RspCode: "99",
      Message: "Unknown error",
    });
  }
});

/**
 * Query transaction status
 * POST /vnpay/query-transaction
 */
router.post("/query-transaction", async (req, res) => {
  try {
    const { orderId, transDate } = req.body;

    if (!orderId || !transDate) {
      return res.status(400).json({
        success: false,
        message: "Order ID and transaction date are required",
      });
    }

    // Get client IP
    const ipAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // TODO: Implement query to VNPAY API
    // For now, return a message
    return res.status(200).json({
      success: true,
      message: "Query transaction feature - to be implemented",
      note: "This requires making HTTP request to VNPAY query API",
    });
  } catch (error) {
    console.error("Error querying transaction:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

/**
 * Get supported banks list
 * GET /vnpay/banks
 */
router.get("/banks", (req, res) => {
  const banks = [
    { code: "", name: "Cổng thanh toán VNPAYQR" },
    { code: "VNPAYQR", name: "Thanh toán qua ứng dụng hỗ trợ VNPAYQR" },
    { code: "VNBANK", name: "Thanh toán qua ứng dụng ngân hàng nội địa" },
    { code: "INTCARD", name: "Thanh toán qua thẻ quốc tế" },
    { code: "VIETQR", name: "Thanh toán qua VietQR" },
    { code: "NCB", name: "Ngân hàng NCB" },
    { code: "VIETCOMBANK", name: "Ngân hàng Vietcombank" },
    { code: "VIETINBANK", name: "Ngân hàng VietinBank" },
    { code: "BIDV", name: "Ngân hàng BIDV" },
    { code: "AGRIBANK", name: "Ngân hàng Agribank" },
    { code: "SACOMBANK", name: "Ngân hàng SacomBank" },
    { code: "TECHCOMBANK", name: "Ngân hàng Techcombank" },
    { code: "ACB", name: "Ngân hàng ACB" },
    { code: "VPBANK", name: "Ngân hàng VPBank" },
    { code: "TPBANK", name: "Ngân hàng TPBank" },
    { code: "MBBANK", name: "Ngân hàng MBBank" },
    { code: "SCB", name: "Ngân hàng SCB" },
    { code: "VIB", name: "Ngân hàng VIB" },
    { code: "SHB", name: "Ngân hàng SHB" },
  ];

  return res.status(200).json({
    success: true,
    banks,
  });
});

export default router;

