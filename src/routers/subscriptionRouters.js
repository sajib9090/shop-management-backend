import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleCreateSubscription,
  handleGetSubscriptionPlan,
  handleGetSubscriptionPlans,
  handlePurchaseSubscriptionPlan,
} from "../controllers/subscriptionControllers.js";
export const subscriptionRouter = express.Router();

subscriptionRouter.post(
  "/create-subscription",
  isLoggedIn,
  isAdmin,
  handleCreateSubscription
);
subscriptionRouter.get("/find-subscription-plans", handleGetSubscriptionPlans);
subscriptionRouter.get(
  "/find-subscription-plan/:id",
  handleGetSubscriptionPlan
);

// purchase subscription
subscriptionRouter.post(
  "/purchase-subscription",
  isLoggedIn,
  handlePurchaseSubscriptionPlan
);
