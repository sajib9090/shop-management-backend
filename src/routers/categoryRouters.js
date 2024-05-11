import express from "express";
import {
  handleCreateCategory,
  handleDeleteCategory,
  handleEditCategory,
  handleGetCategories,
  handleGetSingleCategory,
} from "../controllers/categoryControllers.js";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
import { verifySubscription } from "../middlewares/subscription.js";
export const categoryRouter = express.Router();

categoryRouter.post(
  "/create-category",
  isLoggedIn,
  verifySubscription,
  handleCreateCategory
);

//get route
categoryRouter.get(
  "/find-categories",
  isLoggedIn,
  verifySubscription,
  handleGetCategories
);
categoryRouter.get(
  "/find-category/:param",
  verifySubscription,
  handleGetSingleCategory
);
//delete route
categoryRouter.delete(
  "/remove",
  isLoggedIn,
  verifySubscription,
  handleDeleteCategory
);
//update route
categoryRouter.patch(
  "/update-category/:id",
  isLoggedIn,
  verifySubscription,
  handleEditCategory
);
