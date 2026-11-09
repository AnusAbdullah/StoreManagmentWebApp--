import express from "express";
import {
  createExpense,
  getAllExpenses,
  updateExpenseById,
  deleteExpenseById,
} from "../controller/expenses.js";

const router = express.Router();

router
  .post("/", createExpense)
  .get("/all", getAllExpenses)
  .put("/:id", updateExpenseById)
  .delete("/:id", deleteExpenseById);

export default router;
