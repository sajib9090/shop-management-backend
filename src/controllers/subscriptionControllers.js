import createError from "http-errors";
import { ObjectId } from "mongodb";
import { subscriptionsCollection } from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";
import crypto from "crypto";

const handleCreateSubscription = async (req, res, next) => {
  const user = req.user;

  try {
    if (!user?.admin) {
      throw createError(401, "Unauthorized attempt");
    }

    const {
      plan_name,
      description,
      duration,
      price,
      features,
      limitations,
      upgrade_downgrade_options,
      cancellation_policy,
      trial_period,
      renewal_policy,
      terms_and_conditions,
    } = req.body;

    if (
      [
        plan_name,
        description,
        duration,
        price,
        features,
        limitations,
        upgrade_downgrade_options,
        cancellation_policy,
        trial_period,
        renewal_policy,
        terms_and_conditions,
      ].some((field) => !field || field.trim() === "")
    ) {
      throw createError(400, "All fields are required");
    }

    const processedPlanName = validateString(plan_name, "Plan_name", 2, 100);
    await duplicateChecker(
      subscriptionsCollection,
      "plan_name",
      processedPlanName,
      "Plan name already exists"
    );

    const processedDescription = validateString(
      description,
      "Description",
      15,
      400
    );
    const processedDuration = validateString(duration, "Duration", 2, 30);

    const planPrice = parseFloat(price);
    if (typeof planPrice !== "number" || planPrice <= 0 || isNaN(planPrice)) {
      throw createError(400, "Plan price must be a positive number");
    }

    const processedFeatures = validateString(features, "Features", 10, 400);
    const processedLimitations = validateString(
      limitations,
      "Limitations",
      10,
      200
    );
    const processedUpgradeDownGradeOptions = validateString(
      upgrade_downgrade_options,
      "Upgrade_downgrade_options",
      10,
      200
    );

    const processedCancellationPolicy = validateString(
      cancellation_policy,
      "Cancellation_policy",
      5,
      200
    );
    const processedTrialPeriod = validateString(
      trial_period,
      "Trial_period",
      2,
      20
    );
    const processedRenewalPolicy = validateString(
      renewal_policy,
      "renewal_policy",
      5,
      200
    );
    const processedTermsAndConditions = validateString(
      terms_and_conditions,
      "Terms_and_conditions",
      10,
      500
    );

    const count = await subscriptionsCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newSubscriptionMethod = {
      plan_id: count + 1 + "-" + generateCode,
      plan_name: processedPlanName,
      description: processedDescription,
      duration: processedDuration,
      price: planPrice,
      currency: "USD",
      features: processedFeatures,
      limitations: processedLimitations,
      upgrade_downgrade_options: processedUpgradeDownGradeOptions,
      cancellation_policy: processedCancellationPolicy,
      trial_period: processedTrialPeriod,
      renewal_policy: processedRenewalPolicy,
      terms_and_conditions: processedTermsAndConditions,
      createdBy: user?.user_id,
      createdAt: new Date(),
    };

    await subscriptionsCollection.insertOne(newSubscriptionMethod);

    res.status(200).send({
      success: true,
      message: "Subscription added",
      data: newSubscriptionMethod,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSubscriptionPlans = async (req, res, next) => {
  try {
    const result = await subscriptionsCollection
      .find()
      .sort({ plan_name: 1 })
      .toArray();

    res.status(200).send({
      success: true,
      message: "Plans retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSubscriptionPlan = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }
    const result = await subscriptionsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      throw createError(404, "Not found");
    }

    res.status(200).send({
      success: true,
      message: "Plans retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateSubscription,
  handleGetSubscriptionPlans,
  handleGetSubscriptionPlan,
};
