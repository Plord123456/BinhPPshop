import express from "express";
import cors from "cors";
import "dotenv/config";
import Stripe from "stripe";
import checkout from "./routes/checkout.js";
import vnpay from "./routes/vnpay.js";
import orders from "./routes/orders.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Payment Gateway Server - Stripe & VNPAY");
});
app.use("/", checkout);
app.use("/vnpay", vnpay);
app.use("/orders", orders);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
