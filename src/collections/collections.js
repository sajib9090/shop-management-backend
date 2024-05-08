import { client } from "../config/db.js";

const db_name = "Shop-Management";

const usersCollection = client.db(db_name).collection("users");
const shopsCollection = client.db(db_name).collection("shops");
const categoriesCollection = client.db(db_name).collection("categories");
const groupsCollection = client.db(db_name).collection("groups");
const suppliersCollection = client.db(db_name).collection("suppliers");
const productTypesCollection = client.db(db_name).collection("product-types");
const countriesCollection = client.db(db_name).collection("countries");
const productsCollection = client.db(db_name).collection("products");

export {
  usersCollection,
  shopsCollection,
  categoriesCollection,
  groupsCollection,
  suppliersCollection,
  productTypesCollection,
  countriesCollection,
  productsCollection,
};
