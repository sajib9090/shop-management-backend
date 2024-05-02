import createError from "http-errors";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import { requiredField } from "../helpers/requiredField.js";
import { productTypesCollection } from "../collections/collections.js";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const handleCreateProductType = async (req, res, next) => {
  const user = req.user;
  const { product_type } = req.body;
  try {
    requiredField(product_type, "Product type is required");
    const processedProductType = validateString(
      product_type,
      "Product type",
      1,
      100
    );

    const exists = await productTypesCollection.findOne({
      $and: [
        { shop_name: user?.shop_id },
        { product_type: processedProductType },
      ],
    });

    if (exists) {
      throw createError(400, "Product type already exists for this shop");
    }

    const productTypeSlug = slugify(processedProductType);

    const count = await productTypesCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newProductType = {
      product_type_id: count + 1 + "-" + generateCode,
      shop_id: user?.shop_id,
      product_type: processedProductType,
      product_type_slug: productTypeSlug,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    await productTypesCollection.insertOne(newProductType);

    res.status(200).send({
      success: true,
      message: "Product type created successfully",
      data: newProductType,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetProductTypes = async (req, res, next) => {
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
            { product_type: regExSearch },
            { product_type_slug: regExSearch },
            { product_type_id: regExSearch },
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
            { product_type: regExSearch },
            { product_type_slug: regExSearch },
            { product_type_id: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = { shop_id: user?.shop_id };
      }
    }

    const productTypes = await productTypesCollection
      .find(query)
      .sort({ product_type: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await productTypesCollection.countDocuments(query);

    res.status(200).send({
      success: true,
      message: "Product types retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: productTypes,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleProductType = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;

    if (user?.admin) {
      query = {
        $or: [
          { product_type_id: param },
          { product_type: param },
          { product_type_slug: param },
        ],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [
          { product_type_id: param },
          { product_type: param },
          { product_type_slug: param },
        ],
      };
    }
    const foundProductType = await productTypesCollection.findOne(query);

    if (!foundProductType) {
      throw createError(404, "Product type not found");
    }

    res.status(200).send({
      success: true,
      message: "Product type retrieved successfully",
      data: foundProductType,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteProductType = async (req, res, next) => {
  const { productTypeIds } = req.body;
  try {
    if (!Array.isArray(productTypeIds)) {
      throw createError("productTypeIds must be an array");
    }
    const criteria = { product_type_id: { $in: productTypeIds } };

    const result = await productTypesCollection.deleteMany(criteria);
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

const handleEditProductType = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;
  const { product_type } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }
    const existingProductType = await productTypesCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingProductType) {
      throw createError(404, "Document not found");
    }
    requiredField(product_type, "Product type is required");
    const processedProductType = validateString(
      product_type,
      "Product type",
      3,
      100
    );

    const productTypeWithSameName = await productTypesCollection.findOne({
      product_type: processedProductType,
    });
    if (productTypeWithSameName) {
      throw createError(400, "A product type with this name already exists");
    }

    const filter = { _id: new ObjectId(id) };
    const productTypeSlug = slugify(processedProductType);
    const updateResult = await productTypesCollection.updateOne(filter, {
      $set: {
        product_type: processedProductType,
        product_type_slug: productTypeSlug,
        updatedBy: user?.username,
        updatedAt: new Date(),
      },
    });

    if (updateResult?.modifiedCount !== 1) {
      throw createError(500, "Failed to update the product type");
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
  handleCreateProductType,
  handleGetProductTypes,
  handleGetSingleProductType,
  handleDeleteProductType,
  handleEditProductType,
};
