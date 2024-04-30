import express from "express";
import {
  handleActivateUserAccount,
  handleCreateUser,
  handleGetUsers,
  handleLoginUser,
} from "../controllers/userControllers.js";
export const userRouter = express.Router();

// creation
userRouter.post("/create-user", handleCreateUser);
userRouter.get("/verify/:token", handleActivateUserAccount);
// login logout
userRouter.post("/auth-login", handleLoginUser);
// get
userRouter.get("/find-users", handleGetUsers);
