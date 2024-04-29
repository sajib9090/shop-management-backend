import createError from "http-errors";

export const duplicateChecker = async (
  collectionName,
  key,
  value,
  errorMessage
) => {
  const query = { [key]: value };
  const existingData = await collectionName.findOne(query);
  if (existingData) {
    throw createError(404, errorMessage);
  }
};
