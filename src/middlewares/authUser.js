import createError from "http-errors";
import jwt from "jsonwebtoken";
import { jwtAccessToken } from "../../secret.js";
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many bad request, try again later.",
    });
  },
});

const isLoggedIn = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw createError(401, "Access token not found. Please Login First");
    }

    const decoded = jwt.verify(token, jwtAccessToken);
    // send user information
    req.user = decoded.user;
    if (!decoded) {
      throw createError(403, "Failed to authenticate. Please login");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

const isLoggedOut = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      throw createError(400, "User already logged in");
    }

    next();
  } catch (error) {
    return next(error);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const adminUser = req.user && req.user.admin;

    if (!adminUser) {
      limiter(req, res, next);
    }

    if (!adminUser) {
      throw createError(403, "Forbidden access. Only admin can access");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

const isAuthority = async (req, res, next) => {
  try {
    const authorityUser =
      (req.user && req.user.shop_owner) || req.user.shop_admin;

    if (!authorityUser) {
      throw createError(403, "Forbidden access. Only authority can access");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

const isShopOwner = async (req, res, next) => {
  try {
    const ownerUser = req.user && req.user.shop_owner;
    if (!ownerUser) {
      throw createError(403, "Forbidden access. Only owner can access");
    }
    next();
  } catch (error) {
    return next(error);
  }
};

export { isLoggedIn, isLoggedOut, isAdmin, isAuthority, isShopOwner };
