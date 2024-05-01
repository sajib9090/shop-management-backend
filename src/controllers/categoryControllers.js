import createError from "http-errors";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import { requiredField } from "../helpers/requiredField.js";
import { categoriesCollection } from "../collections/collections.js";
import crypto from "crypto";

const handleCreateCategory = async (req, res, next) => {
  const user = req.user;
  const { category } = req.body;
  try {
    requiredField(category, "Category is required");
    const processedCategoryName = validateString(category, "Category", 3, 100);

    const exists = await categoriesCollection.findOne({
      $and: [
        { shop_name: user?.shop_name },
        { category: processedCategoryName },
      ],
    });

    if (exists) {
      throw createError(400, "Category already exists for this shop");
    }

    const categorySlug = slugify(processedCategoryName);

    const count = await categoriesCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newCategory = {
      category_id: count + 1 + "-" + generateCode,
      shop_name: user?.shop_name,
      category: processedCategoryName,
      category_slug: categorySlug,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    await categoriesCollection.insertOne(newCategory);

    res.status(200).send({
      success: true,
      message: "Category created successfully",
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetCategories = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit);

    const regExSearch = new RegExp(".*" + search + ".*", "i");

    let query = {};
    if (regExSearch) {
      query = {
        $or: [{ shop_name: regExSearch }, { category: regExSearch }],
      };
    }

    const categories = await categoriesCollection
      .find(query)
      .sort({ category: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await categoriesCollection.countDocuments(query);

    res.status(200).send({
      success: true,
      message: "Categories retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleCategory = async (req, res, next) => {
  const { param } = req.params;
  try {
    const foundCategory = await categoriesCollection.findOne({
      $or: [
        { category_id: param },
        { category: param },
        { category_slug: param },
      ],
    });

    if (!foundCategory) {
      throw createError(404, "Category not found");
    }

    res.status(200).send({
      success: true,
      message: "Category retrieved successfully",
      data: foundCategory,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteCategory = async (req, res, next) => {
  const { categoryIds } = req.body;
  try {
    if (!Array.isArray(categoryIds)) {
      throw new Error("CategoryIds must be an array");
    }
    const criteria = { category_id: { $in: categoryIds } };

    const result = await categoriesCollection.deleteMany(criteria);
    if (result.deletedCount == 0) {
      throw createError(404, "Document not found for deletion");
    }

    res.status(200).send({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateCategory,
  handleGetCategories,
  handleGetSingleCategory,
  handleDeleteCategory,
};
