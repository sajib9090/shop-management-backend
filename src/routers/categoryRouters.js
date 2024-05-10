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

categoryRouter.use(isLoggedIn);

categoryRouter.post(
  "/create-category",
  verifySubscription,
  handleCreateCategory
);

//get route
categoryRouter.get("/find-categories", verifySubscription, handleGetCategories);
categoryRouter.get(
  "/find-category/:param",
  verifySubscription,
  handleGetSingleCategory
);
//delete route
categoryRouter.delete("/remove", verifySubscription, handleDeleteCategory);
//update route
categoryRouter.patch(
  "/update-category/:id",
  verifySubscription,
  handleEditCategory
);
