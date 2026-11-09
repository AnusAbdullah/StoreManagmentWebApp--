import express from "express";
import {
  createSalesReturn,
  getAllSalesReturns,
  deleteSalesReturn,
} from "../controller/salesReturn.js";

const router = express.Router();

router.get("/", getAllSalesReturns);
router.post("/", createSalesReturn);
router.delete("/:id", deleteSalesReturn);

export default router;

