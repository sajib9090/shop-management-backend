import jwt from "jsonwebtoken";

const createJWT = async (payload, secretKey, expiresIn) => {
  try {
    if (
      typeof payload !== "object" ||
      !payload ||
      Object.keys(payload).length === 0
    ) {
      throw new Error("Payload must be non-empty object");
    }
    if (typeof secretKey !== "string" || secretKey === "") {
      throw new Error("Secret key must be a not-empty string");
    }
    const token = jwt.sign(payload, secretKey, { expiresIn });

    return token;
  } catch (error) {
    console.error("Failed to sign the JWT:", error);
  }
};

export default createJWT;
