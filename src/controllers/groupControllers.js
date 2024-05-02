import createError from "http-errors";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import { requiredField } from "../helpers/requiredField.js";
import { groupsCollection } from "../collections/collections.js";
import crypto from "crypto";
import { ObjectId } from "mongodb";

const handleCreateGroup = async (req, res, next) => {
  const user = req.user;
  const { group } = req.body;
  try {
    requiredField(group, "Group is required");
    const processedGroupName = validateString(group, "Group", 3, 100);

    const exists = await groupsCollection.findOne({
      $and: [{ shop_ide: user?.shop_name }, { group: processedGroupName }],
    });

    if (exists) {
      throw createError(400, "Group already exists for this shop");
    }

    const groupSlug = slugify(processedGroupName);

    const count = await groupsCollection.countDocuments();
    const generateCode = crypto.randomBytes(16).toString("hex");

    const newGroup = {
      group_id: count + 1 + "-" + generateCode,
      shop_id: user?.shop_id,
      group: processedGroupName,
      group_slug: groupSlug,
      createdBy: user?.username,
      createdAt: new Date(),
    };

    await groupsCollection.insertOne(newGroup);

    res.status(200).send({
      success: true,
      message: "Group created successfully",
      data: newGroup,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetGroups = async (req, res, next) => {
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
            { group: regExSearch },
            { group_slug: regExSearch },
            { group_id: regExSearch },
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
            { group: regExSearch },
            { group_slug: regExSearch },
            { group_id: regExSearch },
            { shop_id: regExSearch },
          ],
        };
      } else {
        query = { shop_id: user?.shop_id };
      }
    }
    const groups = await groupsCollection
      .find(query)
      .sort({ group: 1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .toArray();

    const count = await groupsCollection.countDocuments(query);

    res.status(200).send({
      success: true,
      message: "Groups retrieved successfully",
      data_found: count,
      pagination: {
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        previousPage: page - 1 > 0 ? page - 1 : null,
        nextPage: page + 1 <= Math.ceil(count / limit) ? page + 1 : null,
      },
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetSingleGroup = async (req, res, next) => {
  const { param } = req.params;
  const user = req.user;
  try {
    let query;

    if (user?.admin) {
      query = {
        $or: [{ group_id: param }, { group: param }, { group_slug: param }],
      };
    } else {
      query = {
        $and: [{ shop_id: user?.shop_id }],
        $or: [{ group_id: param }, { group: param }, { group_slug: param }],
      };
    }
    const foundGroup = await groupsCollection.findOne(query);

    if (!foundGroup) {
      throw createError(404, "Group not found");
    }

    res.status(200).send({
      success: true,
      message: "Group retrieved successfully",
      data: foundGroup,
    });
  } catch (error) {
    next(error);
  }
};

const handleDeleteGroup = async (req, res, next) => {
  const { groupIds } = req.body;
  try {
    if (!Array.isArray(groupIds)) {
      throw createError("GroupIds must be an array");
    }
    const criteria = { group_id: { $in: groupIds } };

    const result = await groupsCollection.deleteMany(criteria);
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

const handleEditGroup = async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;
  const { group } = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      throw createError(400, "Invalid id");
    }
    const existingGroup = await groupsCollection.findOne({
      _id: new ObjectId(id),
    });
    if (!existingGroup) {
      throw createError(404, "Document not found");
    }
    requiredField(group, "Group name is required");
    const processedGroupName = validateString(group, "Group", 3, 100);

    const groupWithSameName = await groupsCollection.findOne({
      group: processedGroupName,
    });
    if (groupWithSameName) {
      throw createError(400, "A group with this name already exists");
    }

    const filter = { _id: new ObjectId(id) };
    const groupSlug = slugify(processedGroupName);
    const updateResult = await groupsCollection.updateOne(filter, {
      $set: {
        group: processedGroupName,
        group_slug: groupSlug,
        updatedBy: user?.username,
        updatedAt: new Date(),
      },
    });

    if (updateResult?.modifiedCount !== 1) {
      throw createError(500, "Failed to update the group");
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
  handleCreateGroup,
  handleGetGroups,
  handleGetSingleGroup,
  handleDeleteGroup,
  handleEditGroup,
};
