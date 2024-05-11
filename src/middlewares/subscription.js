import createError from "http-errors";
import rateLimit from "express-rate-limit";
import { shopsCollection } from "../collections/collections.js";

const verifySubscription = async (req, res, next) => {
  const { shop_id } = req.user;
  try {
    if (!shop_id) {
      throw createError(404, "Shop_id mandatory");
    }

    const shop = await shopsCollection.findOne({ shop_id: shop_id });
    if (!shop) {
      throw createError(404, "Shop not found");
    }

    if (
      shop?.subscription_info?.expiresAt == undefined ||
      !shop?.subscription_info?.expiresAt
    ) {
      throw createError(
        400,
        "No subscription found. You can request for free trial"
      );
    }

    const expiresAtDate = new Date(shop.subscription_info.expiresAt);
    const currentDate = new Date();

    const remainingDays = Math.ceil(
      (expiresAtDate - currentDate) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays > 0) {
      if (shop?.subscription_info?.trial_running) {
        req.remainingFreeTrial = remainingDays;
      }
      req.subscriptionRemainingDays = remainingDays;
    }

    const filter = { shop_id: shop_id };
    if (expiresAtDate <= currentDate) {
      await shopsCollection.updateOne(filter, {
        $set: {
          subscription_expired: true,
        },
      });
      throw createError(402, "Subscription needed");
    }

    next();
  } catch (error) {
    return next(error);
  }
};

export { verifySubscription };
