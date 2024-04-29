import express from "express";
import {
  handleActivateUserAccount,
  handleCreateUser,
} from "../controllers/userControllers.js";
export const userRouter = express.Router();

userRouter.post("/create-user", handleCreateUser);
userRouter.get("/verify/:token", handleActivateUserAccount);
