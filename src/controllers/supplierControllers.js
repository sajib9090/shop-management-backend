import createError from "http-errors";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import { requiredField } from "../helpers/requiredField.js";
import { suppliersCollection } from "../collections/collections.js";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const handleCreateSupplier = async (req, res, next) => {
  const user = req.user;
  const { supplier } = req.body;
  try {
    requiredField(supplier, "Supplier is required");
    const processedSupplierName = validateString(supplier, "Supplier", 2, 100);

    const exists = await suppliersCollection.findOne({
      $and: [{ shop_id: user?.shop_id }, { supplier: processedSupplierName }],
    });

    if (exists) {
      throw createError(400, "Supplier already exists for this shop");
    }

    const supplierSlug = slugify(processedSupplierName);

    const count = await suppliersCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newSupplier = {
      supplier_id: count + 1 + "-" + generateCode,
      shop_id: user?.shop_id,
      supplier: processedSupplierName,
      supplier_slug: supplierSlug,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    await suppliersCollection.insertOne(newSupplier);

    res.status(200).send({
      success: true,
      message: "Supplier created successfully",
      data: newSupplier,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSuppliers = async (req, res, next) => {
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
            { supplier: regExSearch },
            { supplier_slug: regExSearch },
            { supplier_id: regExSearch },
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
            { supplier: regExSearch },
            { supplier_slug: regExSearch },
            { supplier_id: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = { shop_id: user?.shop_id };
      }
    }

    const suppliers = await suppliersCollection
      .find(query)
      .sort({ supplier: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await suppliersCollection.countDocuments(query);

    res.status(200).send({
      success: true,
      message: "Suppliers retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleSupplier = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;

    if (user?.admin) {
      query = {
        $or: [
          { supplier_id: param },
          { supplier: param },
          { supplier_slug: param },
        ],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [
          { supplier_id: param },
          { supplier: param },
          { supplier_slug: param },
        ],
      };
    }
    const foundSupplier = await suppliersCollection.findOne(query);

    if (!foundSupplier) {
      throw createError(404, "Supplier not found");
    }

    res.status(200).send({
      success: true,
      message: "Supplier retrieved successfully",
      data: foundSupplier,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteSupplier = async (req, res, next) => {
  const { supplierIds } = req.body;
  try {
    if (!Array.isArray(supplierIds)) {
      throw createError(400, "SupplierIds must be an array");
    }

    const criteria = { supplier_id: { $in: supplierIds } };

    const result = await suppliersCollection.deleteMany(criteria);
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

const handleEditSupplier = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;
  const { supplier } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }
    const existingSupplier = await suppliersCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingSupplier) {
      throw createError(404, "Document not found");
    }
    requiredField(supplier, "Supplier name is required");
    const processedSupplierName = validateString(supplier, "Supplier", 3, 100);

    const supplierWithSameName = await suppliersCollection.findOne({
      supplier: processedSupplierName,
    });
    if (supplierWithSameName) {
      throw createError(400, "A supplier with this name already exists");
    }

    const filter = { _id: new ObjectId(id) };
    const supplierSlug = slugify(processedSupplierName);
    const updateResult = await suppliersCollection.updateOne(filter, {
      $set: {
        supplier: processedSupplierName,
        supplier_slug: supplierSlug,
        updatedBy: user?.username,
        updatedAt: new Date(),
      },
    });

    if (updateResult?.modifiedCount !== 1) {
      throw createError(500, "Failed to update the supplier");
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
  handleCreateSupplier,
  handleGetSuppliers,
  handleGetSingleSupplier,
  handleDeleteSupplier,
  handleEditSupplier,
};
