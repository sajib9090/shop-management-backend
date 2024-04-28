import { client } from "../config/db.js";

const db_name = "Shop-Management";

const usersCollection = client.db(db_name).collection("users");

export { usersCollection };
