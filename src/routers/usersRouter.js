import express from "express";
import { handleCreateUser } from "../controllers/usersController.js";
export const userRouter = express.Router();

userRouter.post("/create-user", handleCreateUser);
