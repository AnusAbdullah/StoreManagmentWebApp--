import express from "express";
import {
  getAllBankAccounts,
  getBankAccountById,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  depositWithdrawManual,
  transferBetweenBanks,
  getAllBankTransactions,
} from "../controller/bankAccounts.js";

const router = express.Router();

router.get("/", getAllBankAccounts);
router.get("/transactions", getAllBankTransactions);
router.get("/:id", getBankAccountById);
router.post("/", createBankAccount);
router.put("/:id", updateBankAccount);
router.delete("/:id", deleteBankAccount);
router.post("/manual-transaction", depositWithdrawManual);
router.post("/transfer", transferBetweenBanks);

export default router;

