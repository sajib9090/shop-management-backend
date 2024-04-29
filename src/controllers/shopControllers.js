import createError from "http-errors";
import { ObjectId } from "mongodb";
import { shopsCollection } from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { requiredObject } from "../helpers/validateObject.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";

const handleCreateShop = async (req, res, next) => {
  try {
    res.status(200).send({
      success: true,
      message: "Shop created successfully",
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreateShop };
