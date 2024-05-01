import { client } from "../config/db.js";

const db_name = "Shop-Management";

const usersCollection = client.db(db_name).collection("users");
const shopsCollection = client.db(db_name).collection("shops");
const categoriesCollection = client.db(db_name).collection("categories");
const groupsCollection = client.db(db_name).collection("groups");
const suppliersCollection = client.db(db_name).collection("suppliers");

export {
  usersCollection,
  shopsCollection,
  categoriesCollection,
  groupsCollection,
  suppliersCollection,
};
