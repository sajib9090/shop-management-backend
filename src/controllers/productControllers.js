import createError from "http-errors";
import { ObjectId } from "mongodb";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";
import crypto from "crypto";
import {
  groupsCollection,
  productsCollection,
} from "../collections/collections.js";

const handleCreateProduct = async (req, res, next) => {
  const user = req.user;
  const {
    product_name,
    group_name,
    supplier,
    category,
    weight_or_size,
    product_type,
    purchase_price,
    sell_price,
  } = req.body;
  try {
    requiredField(product_name, "Product_name is required");
    requiredField(group_name, "Group name is required");
    requiredField(supplier, "Supplier is required");
    requiredField(category, "Category is required");
    requiredField(weight_or_size, "Weight_or_size is required");
    requiredField(product_type, "Product_type is required");
    requiredField(purchase_price, "Purchase_price is required");
    requiredField(sell_price, "Sell_price is required");

    const processedProductName = validateString(
      product_name,
      "Product_name",
      2,
      150
    );
    const processedGroupName = validateString(group_name, "Group_name", 2, 200);
    const processedSupplier = validateString(supplier, "Supplier", 2, 150);
    const processedCategory = validateString(category, "Category", 2, 100);
    const processedWeightOrSize = validateString(
      weight_or_size,
      "Weight_or_size",
      2,
      150
    );
    const processedProductType = validateString(
      product_type,
      "Product_type",
      2,
      100
    );

    const purchasePrice = parseFloat(purchase_price);
    if (
      typeof purchasePrice !== "number" ||
      purchasePrice <= 0 ||
      isNaN(purchasePrice)
    ) {
      throw createError(400, "Purchase price must be a positive number");
    }

    const sellPrice = parseFloat(sell_price);
    if (typeof sellPrice !== "number" || sellPrice <= 0 || isNaN(sellPrice)) {
      throw createError(400, "Sell price must be a positive number");
    }

    if (purchasePrice >= sellPrice) {
      throw createError(400, "Sell price must be more than purchase price");
    }

    const productTitle =
      processedProductType +
      " " +
      processedProductName +
      " " +
      processedWeightOrSize;

    const productTitleSlug = slugify(productTitle);

    const exists = await productsCollection.findOne({
      $and: [
        { shop_id: user?.shop_id },
        { product_title_slug: productTitleSlug },
      ],
    });
    if (exists) {
      throw createError(404, "Already exists this product in this shop");
    }
    const count = await productsCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newProduct = {
      product_id: count + 1 + "-" + generateCode,
      shop_id: user?.shop_id,
      product_title: productTitle,
      product_title_slug: productTitleSlug,
      product_name: processedProductName,
      group_name: processedGroupName,
      supplier: processedSupplier,
      category: processedCategory,
      weight_or_size: processedWeightOrSize,
      product_type: processedProductType,
      discount_option: true,
      purchase_price: purchasePrice,
      sell_price: sellPrice,
      stock_left: 0,
      lifetime_supply: 0,
      lifetime_sells: 0,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    const newItem = await productsCollection.insertOne(newProduct);
    if (!newItem?.insertedId) {
      throw createError(400, "Can't added new product. Please try again");
    }

    res.status(200).send({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetProducts = async (req, res, next) => {
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
            { product_title: regExSearch },
            { product_title_slug: regExSearch },
            { product_name: regExSearch },
            { group_name: regExSearch },
            { supplier: regExSearch },
            { category: regExSearch },
            { product_type: regExSearch },
            { createdBy: regExSearch },
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
            { product_title: regExSearch },
            { product_title_slug: regExSearch },
            { product_name: regExSearch },
            { group_name: regExSearch },
            { supplier: regExSearch },
            { category: regExSearch },
            { product_type: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = { shop_id: user?.shop_id };
      }
    }

    const products = await productsCollection
      .find(query)
      .sort({ product_name: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await productsCollection.countDocuments(query);

    res.status(200).send({
      success: true,
      message: "Products retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleProduct = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;
    if (user?.admin) {
      query = {
        $or: [
          { product_id: param },
          { product_title: param },
          { product_title_slug: param },
        ],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [
          { product_id: param },
          { product_title: param },
          { product_title_slug: param },
        ],
      };
    }

    const existProduct = await productsCollection.findOne(query);

    if (!existProduct) {
      throw createError(404, "Product not found");
    }
    res.status(200).send({
      success: true,
      message: "Product retrieved successfully",
      data: existProduct,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteProduct = async (req, res, next) => {
  const { productIds } = req.body;
  try {
    if (!Array.isArray(productIds)) {
      throw createError("productIds must be an array");
    }
    const criteria = { product_id: { $in: productIds } };

    const result = await productsCollection.deleteMany(criteria);
    if (result.deletedCount == 0) {
      throw createError(404, "Document not found for deletion");
    }

    res.status(200).send({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    next(error);
  }
};

const handleEditProduct = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const {
    product_name,
    group_name,
    supplier,
    category,
    weight_or_size,
    product_type,
    discount_option,
    purchase_price,
    sell_price,
    stock_left,
  } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }

    let query;
    if (user?.admin) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { $and: [{ shop_id: user?.shop_id }, { _id: new ObjectId(id) }] };
    }

    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingProduct) {
      throw createError(404, "Document not found");
    }

    const isEmptyObject = Object.keys(req.body).length === 0;
    const allValuesEmpty = Object.values(req.body).every(
      (value) => value === ""
    );
    if (isEmptyObject || allValuesEmpty) {
      throw createError(400, "Information required for edit");
    }

    let productName;
    if (product_name) {
      productName = validateString(product_name, "Product_name", 2, 150);
    }

    let groupName;
    if (group_name) {
      groupName = validateString(group_name, "Group_name", 2, 150);
    }

    let supplierName;
    if (supplier) {
      supplierName = validateString(supplier, "Supplier", 2, 150);
    }

    let categoryName;
    if (category) {
      categoryName = validateString(category, "Category", 2, 100);
    }

    let weightOrSizeTitle;
    if (weight_or_size) {
      weightOrSizeTitle = validateString(
        weight_or_size,
        "Weight_or_size",
        2,
        150
      );
    }

    let productTypeTitle;
    if (product_type) {
      productTypeTitle = validateString(product_type, "Product_type", 2, 100);
    }

    let purchasePrice;
    if (purchase_price) {
      const numb = parseFloat(purchase_price);

      if (typeof numb !== "number" || numb <= 0 || isNaN(numb)) {
        throw createError(400, "Purchase price must be a positive number");
      }
      purchasePrice = numb;
    }

    let sellPrice;
    if (sell_price) {
      const numb = parseFloat(sell_price);

      if (typeof numb !== "number" || numb <= 0 || isNaN(numb)) {
        throw createError(400, "Sell price must be a positive number");
      }
      sellPrice = numb;
    }

    let stockLeft;
    if (stock_left) {
      const numb = parseInt(stock_left);

      if (typeof numb !== "number" || numb < 0 || isNaN(numb)) {
        throw createError(400, "Stock must must be a number");
      }
      stockLeft = numb;
    }

    if (purchasePrice !== undefined && sellPrice !== undefined) {
      if (purchasePrice >= sellPrice) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    } else if (
      purchasePrice !== undefined &&
      (sellPrice === undefined || isNaN(sellPrice))
    ) {
      if (purchasePrice >= existingProduct?.sell_price) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    } else if (
      (purchasePrice === undefined || isNaN(purchasePrice)) &&
      sellPrice !== undefined
    ) {
      if (sellPrice <= existingProduct?.purchase_price) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    }
    if (purchasePrice && sellPrice) {
      if (purchasePrice >= sellPrice) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    }
    if (purchasePrice && !sellPrice && sellPrice != undefined) {
      if (purchasePrice >= existingProduct?.sell_price) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    }
    if (sellPrice && !purchasePrice && purchasePrice != undefined) {
      if (sellPrice <= existingProduct?.purchase_price) {
        throw createError(400, "Sell price must be higher than purchase price");
      }
    }

    let productTitle;
    let productTitleSlug;
    if (productName || productTypeTitle || weightOrSizeTitle) {
      const type = productTypeTitle
        ? productTypeTitle
        : existingProduct?.product_type;
      const pName = productName ? productName : existingProduct?.product_name;
      const wOrs = weightOrSizeTitle
        ? weightOrSizeTitle
        : existingProduct?.weight_or_size;

      const tempSlug = type + " " + pName + " " + wOrs;
      const pSlug = slugify(tempSlug);

      const existing = await productsCollection.findOne({
        product_title_slug: pSlug,
      });
      if (existing) {
        throw createError(400, "Already exists this title. Try something new");
      }
      productTitle = tempSlug;
      productTitleSlug = pSlug;
    }

    const data = [
      { product_name: productName },
      { product_title: productTitle },
      { product_title_slug: productTitleSlug },
      { group_name: groupName },
      { supplier: supplierName },
      { category: categoryName },
      { weight_or_size: weightOrSizeTitle },
      { product_type: productTypeTitle },
      { discount_option: discount_option },
      { purchase_price: purchasePrice },
      { sell_price: sellPrice },
      { stock_left: stockLeft },
    ];

    const filteredData = data.filter(
      (obj) => Object.values(obj)[0] !== undefined
    );

    const updateFields = {};
    filteredData.forEach((obj) => {
      const key = Object.keys(obj)[0];
      const value = Object.values(obj)[0];
      updateFields[key] = value;
    });

    const updatedResult = await productsCollection.updateOne(query, {
      $set: {
        ...updateFields,
        updatedBy: user?.username,
        updatedAt: new Date(),
      },
    });

    if (!updatedResult.modifiedCount) {
      throw createError(400, "Something went wrong when updating. Try again");
    }

    res.status(200).send({
      success: true,
      message: "Product edited",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateProduct,
  handleGetProducts,
  handleGetSingleProduct,
  handleDeleteProduct,
  handleEditProduct,
};
