import express from "express";

import {
  handleActivateUserAccount,
  handleCreateUser,
  handleGetSingleUser,
  handleGetUsers,
  handleLoginUser,
  handleLogoutUser,
  handleRefreshToken,
} from "../controllers/userControllers.js";
import {
  isAdmin,
  isLoggedIn,
  isLoggedOut,
  isAuthority,
  isShopOwner,
} from "../middlewares/authUser.js";
export const userRouter = express.Router();




// creation
userRouter.post("/create-user", handleCreateUser);
userRouter.get("/verify/:token", handleActivateUserAccount);
// login logout
userRouter.post("/auth-user-login", isLoggedOut, handleLoginUser);
userRouter.post("/auth-user-logout", isLoggedIn, handleLogoutUser);
// manage refresh-access token
userRouter.get("/auth-manage-token", handleRefreshToken);
// get
userRouter.get("/find-users", isLoggedIn, handleGetUsers);
userRouter.get("/find-user/:id", isLoggedIn, handleGetSingleUser);

//check route
userRouter.get("/check", isLoggedIn, isAdmin, handleGetUsers);
