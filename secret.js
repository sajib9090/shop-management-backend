import "dotenv/config";

const port = process.env.PORT;
const mongoDB_URI = process.env.MONGODB_URI;

const jwtSecret = process.env.JWT_SECRET;
const jwtAccessToken = process.env.JWT_ACCESS_KEY;
const jwtRefreshToken = process.env.JWT_REFRESH_KEY;

const smtpUsername = process.env.SMTP_USERNAME;
const smtpPassword = process.env.SMTP_PASSWORD;

const clientURL = process.env.CLIENT_URL;

export {
  port,
  mongoDB_URI,
  jwtSecret,
  jwtAccessToken,
  jwtRefreshToken,
  smtpUsername,
  smtpPassword,
  clientURL,
};
