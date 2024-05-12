import createError from "http-errors";
import { ObjectId } from "mongodb";
import {
  shopsCollection,
  subscriptionsCollection,
} from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { requiredObject } from "../helpers/validateObject.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";

const handleGetShops = async (req, res, next) => {
  try {
    const user = req.user;
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit);

    const regExSearch = new RegExp(".*" + search + ".*", "i");

    let query;
    if (user?.admin) {
      if (search) {
        query = {
          $or: [
            { shop_id: regExSearch },
            { shop_name: regExSearch },
            { shop_slug: regExSearch },
            { createdBy: regExSearch },
          ],
        };
      }
    }

    const shops = await shopsCollection
      .find(query)
      .sort({ shop_name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await shopsCollection.countDocuments(query);
    res.status(200).send({
      success: true,
      message: "Shops retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleShop = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;
    if (user?.admin) {
      query = {
        $or: [{ shop_id: param }, { shop_name: param }, { shop_slug: param }],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [{ shop_id: param }, { shop_name: param }, { shop_slug: param }],
      };
    }
    const foundShop = await shopsCollection.findOne(query);

    if (!foundShop) {
      throw createError(404, "Shop not found");
    }

    res.status(200).send({
      success: true,
      message: "Shop retrieved successfully",
      data: foundShop,
    });
  } catch (error) {
    next(error);
  }
};

const handleFreeTrial = async (req, res, next) => {
  const user = req.user;
  const { plan_id } = req.body;

  try {
    requiredField(plan_id, "Plan_id is required");
    if (typeof plan_id !== "string" || plan_id?.length !== 34) {
      throw createError(400, "Invalid plan_id");
    }
    const shop = await shopsCollection.findOne({ shop_id: user?.shop_id });
    if (!shop) {
      throw createError(404, "Invalid request");
    }

    const expiresAtDate = new Date(shop.subscription_info.expiresAt);
    const currentDate = new Date();

    const remainingDays = Math.ceil(
      (expiresAtDate - currentDate) / (1000 * 60 * 60 * 24)
    );

    if (shop?.subscription_info?.trial_running) {
      throw createError(
        400,
        `Your free trial is running. ${remainingDays} days remaining`
      );
    }
    if (shop?.subscription_info?.trial_over) {
      throw createError(
        402,
        "You used your free trial. No trial available, need subscription"
      );
    }

    const plan = await subscriptionsCollection.findOne({ plan_id: plan_id });
    if (!plan) {
      throw createError(404, "Subscription plan not found");
    }

    const freeTrialAvailableDays = parseInt(plan.trial_period.split(" ")[0]);

    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + freeTrialAvailableDays);

    const filter = { shop_id: shop?.shop_id };

    const updatedInfo = {
      subscription_info: {
        ...shop?.subscription_info,
        selected_plan_id: plan?.plan_id,
        trial_running: true,
        expiresAt: trialDate,
        trial_startAt: new Date(),
      },
      subscription_expired: false,
      last_updated_for_subscription: new Date(),
      updatedBy: user?.user_id,
      updatedAt: new Date(),
    };

    await shopsCollection.findOneAndUpdate(filter, {
      $set: updatedInfo,
    });

    res.status(200).send({
      success: true,
      message: "Free trial updated successful",
    });
  } catch (error) {
    next(error);
  }
};

export { handleGetShops, handleGetSingleShop, handleFreeTrial };
