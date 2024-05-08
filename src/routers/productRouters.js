import express from "express";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleCreateProduct,
  handleDeleteProduct,
  handleEditProduct,
  handleGetProducts,
  handleGetSingleProduct,
} from "../controllers/productControllers.js";
export const productRouter = express.Router();

productRouter.post("/create-product", isLoggedIn, handleCreateProduct);

//get route
productRouter.get("/find-products", isLoggedIn, handleGetProducts);
productRouter.get("/find-product/:param", isLoggedIn, handleGetSingleProduct);
//delete route
productRouter.delete("/remove", isLoggedIn, handleDeleteProduct);
//edit route
productRouter.patch("/edit-product/:id", isLoggedIn, handleEditProduct);
// //update route
// supplierRouter.patch("/update-supplier/:id", isLoggedIn, handleEditSupplier);
