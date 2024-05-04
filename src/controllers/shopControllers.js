import createError from "http-errors";
import { ObjectId } from "mongodb";
import { shopsCollection } from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { requiredObject } from "../helpers/validateObject.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";

const handleGetShops = async (req, res, next) => {
  try {
    const user = req.user;
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit);

    const regExSearch = new RegExp(".*" + search + ".*", "i");

    let query;
    if (user?.admin) {
      if (search) {
        query = {
          $or: [
            { shop_id: regExSearch },
            { shop_name: regExSearch },
            { shop_slug: regExSearch },
            { createdBy: regExSearch },
          ],
        };
      }
    }

    const shops = await shopsCollection
      .find(query)
      .sort({ shop_name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await shopsCollection.countDocuments(query);
    res.status(200).send({
      success: true,
      message: "Shops retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: shops,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleShop = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;
    if (user?.admin) {
      query = {
        $or: [{ shop_id: param }, { shop_name: param }, { shop_slug: param }],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [{ shop_id: param }, { shop_name: param }, { shop_slug: param }],
      };
    }
    const foundShop = await shopsCollection.findOne(query);

    if (!foundShop) {
      throw createError(404, "Shop not found");
    }

    res.status(200).send({
      success: true,
      message: "Shop retrieved successfully",
      data: foundShop,
    });
  } catch (error) {
    next(error);
  }
};

export { handleGetShops, handleGetSingleShop };
