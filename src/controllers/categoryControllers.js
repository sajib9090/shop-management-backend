import createError from "http-errors";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import { requiredField } from "../helpers/requiredField.js";
import { categoriesCollection } from "../collections/collections.js";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const handleCreateCategory = async (req, res, next) => {
  const user = req.user;
  const { category } = req.body;
  try {
    requiredField(category, "Category is required");
    const processedCategoryName = validateString(category, "Category", 3, 100);

    const exists = await categoriesCollection.findOne({
      $and: [{ shop_id: user?.shop_id }, { category: processedCategoryName }],
    });

    if (exists) {
      throw createError(400, "Category already exists for this shop");
    }

    const categorySlug = slugify(processedCategoryName);

    const count = await categoriesCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newCategory = {
      category_id: count + 1 + "-" + generateCode,
      shop_id: user?.shop_id,
      category: processedCategoryName,
      category_slug: categorySlug,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    const newItem = await categoriesCollection.insertOne(newCategory);
    if (!newItem?.insertedId) {
      throw createError(400, "Can't added new category. Please try again");
    }

    res.status(201).send({
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
            { category: regExSearch },
            { category_slug: regExSearch },
            { category_id: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = {};
      }
    } else {
      if (search) {
        query = {
          $and: [
            {
              shop_id: user?.shop_id,
            },
          ],
          $or: [
            { category: regExSearch },
            { category_slug: regExSearch },
            { category_id: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = { shop_id: user?.shop_id };
      }
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
  const user = req.user;
  try {
    let query;

    if (user?.admin) {
      query = {
        $or: [
          { category_id: param },
          { category: param },
          { category_slug: param },
        ],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [
          { category_id: param },
          { category: param },
          { category_slug: param },
        ],
      };
    }
    const foundCategory = await categoriesCollection.findOne(query);

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
      throw createError("CategoryIds must be an array");
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

const handleEditCategory = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;
  const { category } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }
    const existingCategory = await categoriesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingCategory) {
      throw createError(404, "Document not found");
    }
    requiredField(category, "Category name is required");
    const processedCategoryName = validateString(category, "Category", 3, 100);

    const categoryWithSameName = await categoriesCollection.findOne({
      category: processedCategoryName,
    });
    if (categoryWithSameName) {
      throw createError(400, "A category with this name already exists");
    }

    const filter = { _id: new ObjectId(id) };
    const categorySlug = slugify(processedCategoryName);
    const updateResult = await categoriesCollection.updateOne(filter, {
      $set: {
        category: processedCategoryName,
        category_slug: categorySlug,
        updatedBy: user?.username,
        updatedAt: new Date(),
      },
    });

    if (updateResult?.modifiedCount !== 1) {
      throw createError(500, "Failed to update the category");
    }

    res.status(200).send({
      success: true,
      message: "Updated successfully",
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
  handleEditCategory,
};
