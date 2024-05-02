import express from "express";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleCreateProductType,
  handleDeleteProductType,
  handleEditProductType,
  handleGetProductTypes,
  handleGetSingleProductType,
} from "../controllers/productTypeControllers.js";

export const productTypeRouter = express.Router();

productTypeRouter.post(
  "/create-product-type",
  isLoggedIn,
  isAuthority,
  handleCreateProductType
);

//get route
productTypeRouter.get(
  "/find-product-types",
  isLoggedIn,
  isAuthority,
  handleGetProductTypes
);
productTypeRouter.get("/find-product-type/:param", handleGetSingleProductType);
//delete route
productTypeRouter.delete("/remove", isLoggedIn, handleDeleteProductType);
//update route
productTypeRouter.patch(
  "/update-product-type/:id",
  isLoggedIn,
  handleEditProductType
);
