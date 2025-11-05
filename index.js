import express from "express";
import cors from "cors";
import "dotenv/config";
import Stripe from "stripe";
import checkout from "./routes/checkout.js";
import orders from "./routes/orders.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (for test page)
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.send("Payment Gateway Server - Stripe");
});
app.use("/", checkout);
app.use("/orders", orders);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
