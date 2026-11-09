import express from "express";
import {
  createPurchase,
  getAllPurchases,
  deletePurchase,
} from "../controller/purchases.js";

const router = express.Router();

router
  .post("/", createPurchase)
  .get("/all", getAllPurchases)
  .delete("/:id", deletePurchase);

export default router;
