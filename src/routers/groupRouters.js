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

groupRouter.post("/create-group", isLoggedIn, isAuthority, handleCreateGroup);

//get route
groupRouter.get("/find-groups", isLoggedIn, isAuthority, handleGetGroups);
groupRouter.get("/find-group/:param", handleGetSingleGroup);
//delete route
groupRouter.delete("/remove", handleDeleteGroup);
//update route
groupRouter.patch(
  "/update-group/:id",
  isLoggedIn,
  isAuthority,
  handleEditGroup
);
