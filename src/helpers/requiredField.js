import createError from "http-errors";
export const requiredField = (field, errorTitle) => {
  if (!field) {
    throw createError(400, errorTitle);
  }
};
