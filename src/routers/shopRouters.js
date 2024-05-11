import express from "express";
import { isAdmin, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleFreeTrial,
  handleGetShops,
  handleGetSingleShop,
} from "../controllers/shopControllers.js";

export const shopRouter = express.Router();

shopRouter.get("/find-shops", isLoggedIn, isAdmin, handleGetShops);
shopRouter.get("/find-shop/:param", isLoggedIn, handleGetSingleShop);

//free trial manage
shopRouter.patch("/request-free-trial", isLoggedIn, handleFreeTrial);
