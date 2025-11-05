import express from "express";
import cors from "cors";
import "dotenv/config";
import Stripe from "stripe";
import checkout from "./routes/checkout.js";
import vnpay from "./routes/vnpay.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Payment Gateway Server - Stripe & VNPAY");
});
app.use("/", checkout);
app.use("/", vnpay);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
