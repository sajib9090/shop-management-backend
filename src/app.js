import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import createError from "http-errors";
import { rateLimit } from "express-rate-limit";
import UAParser from "ua-parser-js";
import { userRouter } from "./routers/userRouters.js";
import { shopRouter } from "./routers/shopRouters.js";
import { categoryRouter } from "./routers/categoryRouters.js";
import { groupRouter } from "./routers/groupRouters.js";
import { supplierRouter } from "./routers/supplierRouters.js";
import { productTypeRouter } from "./routers/productTypeRouters.js";
import { productRouter } from "./routers/productRouters.js";
import { subscriptionRouter } from "./routers/subscriptionRouters.js";

const app = express();

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res
      .status(429)
      .json({ success: false, message: "Too many requests, try again later." });
  },
});

//middleware
app.use(
  cors({
    origin: [
      "https://authentication-with-next.vercel.app",
      "https://shop-management-backend-84x8.onrender.com",
      "http://localhost:3000",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/shops", shopRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/api/v1/suppliers", supplierRouter);
app.use("/api/v1/product-types", productTypeRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);

app.get("/", (req, res) => {
  
  const userAgent = req.headers["user-agent"];
  const parser = new UAParser();
  const result = parser.setUA(userAgent).getResult();

  // Extract browser and device information
  const browser = result?.browser?.name
    ? result?.browser?.name
    : result?.ua || "Unknown";
  const device = userAgent?.includes("Mobile") ? "Mobile" : "Desktop";
  const os = { name: result?.os?.name, version: result?.os?.version };
  res.status(200).send({
    success: true,
    message: "Server is running",
    browser: browser,
    device: device,
    operatingSystem: os,
  });
});

//client error handling
app.use((req, res, next) => {
  createError(404, "Route not found!");
  next();
});

//server error handling
app.use((err, req, res, next) => {
  return res.status(err.status || 500).json({
    success: false,
    message: err.message,
  });
});

export default app;
