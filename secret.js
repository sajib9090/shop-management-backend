import "dotenv/config";

const port = process.env.PORT;
const mongoDB_URI = process.env.MONGODB_URI;

export { port, mongoDB_URI };
