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

supplierRouter.post(
  "/create-supplier",
  isLoggedIn,
  isAuthority,
  handleCreateSupplier
);

//get route
supplierRouter.get(
  "/find-suppliers",
  isLoggedIn,
  isAuthority,
  handleGetSuppliers
);
supplierRouter.get("/find-supplier/:param", handleGetSingleSupplier);
//delete route
supplierRouter.delete("/remove", handleDeleteSupplier);
//update route
supplierRouter.patch(
  "/update-supplier/:id",
  isLoggedIn,
  isAuthority,
  handleEditSupplier
);
