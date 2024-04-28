import { MongoClient } from "mongodb";
import { mongoDB_URI } from "../../secret.js";

export const client = new MongoClient(mongoDB_URI, {});

const connectDB = async () => {
  try {
    await client.connect();
    console.log("Pinged! MongoDB connected successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
