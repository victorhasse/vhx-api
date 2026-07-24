import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/database/connection.js";
import webhookRoutes from "./src/routes/webhooks.js";
import productRoutes from "./src/routes/products.js";
import authRoutes from "./src/routes/auth.js";
import orderRoutes from "./src/routes/orders.js";
import paymentRoutes from "./src/routes/payments.js";
import shippingRoutes from "./src/routes/shipping.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://victorhasse.github.io",
    ],
    credentials: true,
  }),
);
/*
 * O webhook precisa receber o corpo original.
 * Esta rota deve ficar antes de express.json().
 */
app.use(
  "/api/webhooks",
  express.raw({
    type: "application/json",
  }),
  webhookRoutes,
);

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.get("/api/health", (req, res) => {
  res.json({ status: "VHX API rodando ✅", version: "1.0.0" });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 VHX API rodando em http://localhost:${PORT}`);
  });
});

export default app;
