import createError from "http-errors";
import { ObjectId } from "mongodb";
import {
  shopsCollection,
  usersCollection,
} from "../collections/collections.js";
import { validateString } from "../helpers/validateString.js";
import slugify from "slugify";
import validator from "validator";
import { requiredField } from "../helpers/requiredField.js";
import { requiredObject } from "../helpers/validateObject.js";
import { duplicateChecker } from "../helpers/duplicateChecker.js";
import bcrypt from "bcryptjs";
import createJWT from "../helpers/createJWT.js";
import {
  clientURL,
  jwtAccessToken,
  jwtRefreshToken,
  jwtSecret,
} from "../../secret.js";
import { emailWithNodeMailer } from "../helpers/email.js";
import jwt from "jsonwebtoken";

const handleCreateUser = async (req, res, next) => {
  const { shop_name, email, name, mobile, password, address } = req.body;
  try {
    // required field validation
    requiredField(shop_name, "Shop name is required");
    requiredField(name, "Name is required");
    requiredField(email, "Email is required");
    requiredField(mobile, "Mobile number is required");
    requiredField(password, "Password is required");
    address && requiredObject(address, "Address should be an object");
    requiredField(
      address ? address?.detailed_shop_address : "",
      "Exact detailed shop address is required in address"
    );
    requiredField(
      address && address?.country,
      "Country is required in address"
    );

    const processedShopName = validateString(shop_name, "Shop name", 3, 100);
    const processedName = validateString(name, "Name", 2, 100);
    //if anyone try to put space with username it will remove spaces

    if (!validator.isEmail(email)) {
      throw createError(400, "Invalid email address");
    }

    const generateUsername = email
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase()
      .split("@");

    if (!validator.isMobilePhone(mobile, "any")) {
      throw createError(400, "Invalid mobile number");
    }

    await duplicateChecker(
      usersCollection,
      "shop_name",
      processedShopName,
      "Shop name already exists. Try something different"
    );
    await duplicateChecker(
      usersCollection,
      "username",
      processedShopName,
      "Username already taken. Try something different"
    );
    await duplicateChecker(
      usersCollection,
      "email",
      processedShopName,
      "Email already exists. Try something different"
    );

    if (password.length < 6) {
      throw createError(400, "Password must be at least 6 characters long");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create token
    const token = await createJWT(
      {
        shop_name: processedShopName,
        name: processedName,
        username: generateUsername[0],
        email,
        mobile,
        password: hashedPassword,
        address,
        admin: false,
        shop_owner: true,
        shop_admin: false,
        banned_user: false,
        deleted_user: false,
      },
      jwtSecret,
      "10m"
    );

    //prepare email
    const emailData = {
      email,
      subject: "Account Creation Confirmation",
      html: `<h2>Hello ${processedName}!</h2>
      <p>Please click here to <a href="${clientURL}/api/v1/users/verify/${token}">activate your account</a></p>
      <p>This link will expires in 10 minutes</p>`,
    };

    //send email with nodemailer
    try {
      await emailWithNodeMailer(emailData);
    } catch (emailError) {
      next(createError(500, "Failed to send verification email"));
    }

    res.status(200).send({
      success: true,
      message: `Please go to your email at ${email} and complete registration process`,
    });
  } catch (error) {
    next(error);
  }
};

const handleActivateUserAccount = async (req, res, next) => {
  const token = req.params.token;
  try {
    if (!token) {
      throw createError(404, "Token not found");
    }

    const decoded = jwt.verify(token, jwtSecret);
    // Respond with the created user
    if (!decoded) {
      throw createError(404, "User validation failed");
    }

    const existingUser = await usersCollection.findOne({
      $or: [
        { shop_name: decoded?.shop_name },
        { email: decoded?.email },
        { username: decoded?.username },
      ],
    });

    if (existingUser) {
      throw createError(
        "409",
        "User already exist with this Shop name or username or email. Please sign in"
      );
    }

    const count = await usersCollection.countDocuments();
    const userId = String(count + 1).padStart(12, "0");

    const newUser = {
      shop_name: decoded?.shop_name,
      user_id: userId,
      name: decoded?.name,
      username: decoded?.username,
      email: decoded?.email,
      mobile: decoded?.mobile,
      password: decoded?.password,
      admin: decoded?.admin,
      shop_owner: decoded?.shop_owner,
      shop_admin: decoded?.shop_admin,
      banned_user: decoded?.banned_user,
      deleted_user: decoded?.deleted_user,
      address: decoded?.address,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    const newShop = {
      shop_name: decoded?.shop_name,
      shop_slug: slugify(decoded?.shop_name),
      address: decoded?.address,
      subscription: { last_payment: "" },
      payment_info: { payment_invoices: [] },
      subscription_expired: false,
      shop_images: { logo: "", favicon: "" },
      createdBy: decoded?.username,
      createdAt: new Date(),
    };

    const createdNewShop = await shopsCollection.insertOne(newShop);
    if (!createdNewShop?.insertedId) {
      throw createError(
        400,
        "Something went wrong. when shop information inserted"
      );
    }

    res.setHeader("Content-Type", "text/html");

    // Send the HTML content as the response body
    const htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                <title>User Activated</title>
            </head>
            <body>
                <h1>User created successfully</h1>
                <p>Now you can close this window </p>
                <!-- Your HTML content for the user interface goes here -->
            </body>
        </html>
    `;
    res.status(200).send(htmlContent);
  } catch (error) {
    next(error);
  }
};

const handleLoginUser = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    if ((!username && !email) || !password) {
      throw createError(400, "Username or email and password is required");
    }

    const stringEmail =
      email && email ? email?.trim().replace(/\s+/g, "").toLowerCase() : "";
    const stringUsername =
      username && username
        ? username?.trim().replace(/\s+/g, "").toLowerCase()
        : "";

    if (email && !validator.isEmail(stringEmail)) {
      next(createError.BadRequest("Invalid email address format"));
      return;
    }

    //password validation
    if (password.length < 6) {
      next(
        createError.Unauthorized("Password should be at least 6 characters")
      );
      return;
    }

    const existUser = await usersCollection.findOne({
      $or: [{ username: stringUsername }, { email: stringEmail }],
    });

    if (!existUser) {
      next(createError.BadRequest("Invalid username or email address"));
      return;
    }

    //match password
    const isPasswordValid = await bcrypt.compare(password, existUser.password);
    if (!isPasswordValid) {
      next(createError.Unauthorized("Invalid Password"));
      return;
    }

    //check user banned or not
    if (existUser.banned_user) {
      next(
        createError.Unauthorized("You are banned. Please contact authority")
      );
      return;
    }

    //check user banned or not
    if (existUser.deleted_user) {
      next(
        createError.Unauthorized("You are deleted. Please contact authority")
      );
      return;
    }

    //token cookie
    const accessToken = await createJWT({ existUser }, jwtAccessToken, "1m");
    res.cookie("accessToken", accessToken, {
      maxAge: 60 * 1000, // 1 minute in milliseconds
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    const refreshToken = await createJWT({ existUser }, jwtRefreshToken, "7d");
    res.cookie("refreshToken", refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    const loggedInUser = existUser;
    delete loggedInUser.password;
    delete loggedInUser.admin;

    res.status(200).send({
      success: true,
      message: "Login successfully",
      data: loggedInUser,
    });
  } catch (error) {
    next(error);
  }
};

const handleGetUsers = async (req, res, next) => {
  try {
    res.status(200).send({
      success: true,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  handleCreateUser,
  handleActivateUserAccount,
  handleGetUsers,
  handleLoginUser,
};
