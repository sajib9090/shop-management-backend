import createError from "http-errors";

export const requiredObject = (field, errorTitle) => {
  if (typeof field !== "object") {
    throw createError(400, errorTitle);
  }
};
