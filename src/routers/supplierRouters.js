import express from "express";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleCreateSupplier,
  handleDeleteSupplier,
  handleEditSupplier,
  handleGetSingleSupplier,
  handleGetSuppliers,
} from "../controllers/supplierControllers.js";
export const supplierRouter = express.Router();

supplierRouter.post("/create-supplier", isLoggedIn, handleCreateSupplier);

//get route
supplierRouter.get("/find-suppliers", isLoggedIn, handleGetSuppliers);
supplierRouter.get(
  "/find-supplier/:param",
  isLoggedIn,
  handleGetSingleSupplier
);
//delete route
supplierRouter.delete("/remove", isLoggedIn, handleDeleteSupplier);
//update route
supplierRouter.patch("/update-supplier/:id", isLoggedIn, handleEditSupplier);
