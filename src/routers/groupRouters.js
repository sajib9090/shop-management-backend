import express from "express";
import { isAuthority, isLoggedIn } from "../middlewares/authUser.js";
import {
  handleCreateGroup,
  handleDeleteGroup,
  handleEditGroup,
  handleGetGroups,
  handleGetSingleGroup,
} from "../controllers/groupControllers.js";
export const groupRouter = express.Router();

groupRouter.post("/create-group", isLoggedIn, handleCreateGroup);

//get route
groupRouter.get("/find-groups", isLoggedIn, isAuthority, handleGetGroups);
groupRouter.get("/find-group/:param", isLoggedIn, handleGetSingleGroup);
//delete route
groupRouter.delete("/remove", isLoggedIn, handleDeleteGroup);
//update route
groupRouter.patch("/update-group/:id", isLoggedIn, handleEditGroup);
