import express from "express";
import {
  handleCreateCategory,
  handleDeleteCategory,
  handleEditCategory,
  handleGetCategories,
  handleGetSingleCategory,
} from "../controllers/categoryControllers.js";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
export const categoryRouter = express.Router();

categoryRouter.post(
  "/create-category",
  isLoggedIn,
  isAuthority,
  handleCreateCategory
);

//get route
categoryRouter.get(
  "/find-categories",
  isLoggedIn,
  isAuthority,
  handleGetCategories
);
categoryRouter.get("/find-category/:param", handleGetSingleCategory);
//delete route
categoryRouter.delete("/remove", handleDeleteCategory);
//update route
categoryRouter.patch(
  "/update-category/:id",
  isLoggedIn,
  isAuthority,
  handleEditCategory
);
