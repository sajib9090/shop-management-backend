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

categoryRouter.post("/create-category", isLoggedIn, handleCreateCategory);

//get route
categoryRouter.get("/find-categories", isLoggedIn, handleGetCategories);
categoryRouter.get(
  "/find-category/:param",
  isLoggedIn,
  handleGetSingleCategory
);
//delete route
categoryRouter.delete("/remove", isLoggedIn, handleDeleteCategory);
//update route
categoryRouter.patch("/update-category/:id", isLoggedIn, handleEditCategory);
