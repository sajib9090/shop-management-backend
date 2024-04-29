import createError from "http-errors";
import { ObjectId } from "mongodb";
import { usersCollection } from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { requiredObject } from "../helpers/validateObject.js";

const handleCreateUser = async (req, res, next) => {
  const { shop_name, email, name, username, mobile, password, address } =
    req.body;
  try {
    // required field validation
    requiredField(shop_name, "Shop name is required");
    requiredField(name, "Full name is required");
    requiredField(username, "Username is required");
    requiredField(email, "Email is required");
    requiredField(mobile, "Mobile number is required");
    requiredField(password, "Password is required");
    requiredObject(address, "Address should be a non empty object");
    requiredField(
      address?.detailed_shop_address,
      "Exact detailed shop address is required"
    );
    requiredField(address?.country, "Country is required");

    const processedShopName = validateString(shop_name, "Shop name", 3, 100);
    const processedName = validateString(name, "Name", 2, 100);

    res.status(200).send({
      success: true,
      message: "User created successfully",
      data: req.body,
    });
  } catch (error) {
    next(error);
  }
};

export { handleCreateUser };
