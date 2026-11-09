import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { Op } from "sequelize";

/**
 * Core helper to record a bank transaction and automatically update account balance.
 * Used internally by Sales, Purchases, Khata, Expenses, Salary, and direct banking operations.
 */
export const recordBankTransaction = async ({
  bankAccountId,
  type, // "deposit" | "withdrawal"
  amount,
  category = "General",
  reference = "",
  sourceEntity = null,
  sourceId = null,
  date = null,
  description = "",
}) => {
  if (!bankAccountId) return null;
  const numAmount = Number(amount || 0);
  if (numAmount <= 0) return null;

  const account = await BankAccount.findByPk(bankAccountId);
  if (!account) {
    throw new Error(`Bank account #${bankAccountId} not found`);
  }

  const txDate = date || new Date().toISOString().slice(0, 10);
  let newBalance = Number(account.currentBalance || 0);

  if (type === "deposit") {
    newBalance = Math.round((newBalance + numAmount) * 100) / 100;
  } else if (type === "withdrawal") {
    newBalance = Math.round((newBalance - numAmount) * 100) / 100;
  } else {
    throw new Error(`Invalid transaction type: ${type}`);
  }

  const transaction = await BankTransaction.create({
    bankAccountId,
    type,
    amount: numAmount,
    balanceAfter: newBalance,
    category,
    reference,
    sourceEntity,
    sourceId,
    date: txDate,
    description: description || `${type === "deposit" ? "Deposit" : "Withdrawal"} for ${category}`,
  });

  account.currentBalance = newBalance;
  await account.save();

  return { transaction, updatedAccount: account };
};

// ─── Controller Endpoints ─────────────────────────────────

export const getAllBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.findAll({
      order: [["id", "ASC"]],
    });

    const totalFunds = accounts.reduce((acc, a) => acc + Number(a.currentBalance || 0), 0);

    return res.status(200).json({
      accounts,
      totalFunds,
      activeCount: accounts.filter((a) => a.status === "Active").length,
    });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getBankAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findByPk(id, {
      include: [
        {
          model: BankTransaction,
          as: "transactions",
          order: [["id", "DESC"]],
        },
      ],
    });

    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error("Error fetching bank account by id:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const createBankAccount = async (req, res) => {
  try {
    const {
      bankName,
      accountTitle,
      accountNumber,
      iban,
      branch,
      openingBalance,
      status,
      notes,
    } = req.body;

    if (!bankName || !accountTitle || !accountNumber) {
      return res.status(400).json({ error: "Bank Name, Account Title, and Account Number are required." });
    }

    const openBal = Number(openingBalance || 0);

    const newAccount = await BankAccount.create({
      bankName: bankName.trim(),
      accountTitle: accountTitle.trim(),
      accountNumber: String(accountNumber).trim(),
      iban: iban ? iban.trim() : "",
      branch: branch ? branch.trim() : "",
      openingBalance: openBal,
      currentBalance: openBal,
      status: status || "Active",
      notes: notes || "",
    });

    // If opening balance > 0, log an initial deposit transaction
    if (openBal > 0) {
      await BankTransaction.create({
        bankAccountId: newAccount.id,
        type: "deposit",
        amount: openBal,
        balanceAfter: openBal,
        category: "Initial Opening Balance",
        reference: "Account Setup",
        sourceEntity: "adjustment",
        sourceId: newAccount.id,
        date: new Date().toISOString().slice(0, 10),
        description: `Initial opening balance recorded for ${newAccount.bankName} (${newAccount.accountNumber})`,
      });
    }

    return res.status(201).json(newAccount);
  } catch (error) {
    console.error("Error creating bank account:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bankName,
      accountTitle,
      accountNumber,
      iban,
      branch,
      status,
      notes,
    } = req.body;

    const account = await BankAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    if (bankName !== undefined) account.bankName = bankName.trim();
    if (accountTitle !== undefined) account.accountTitle = accountTitle.trim();
    if (accountNumber !== undefined) account.accountNumber = String(accountNumber).trim();
    if (iban !== undefined) account.iban = iban ? iban.trim() : "";
    if (branch !== undefined) account.branch = branch ? branch.trim() : "";
    if (status !== undefined) account.status = status;
    if (notes !== undefined) account.notes = notes;

    await account.save();
    return res.status(200).json(account);
  } catch (error) {
    console.error("Error updating bank account:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteBankAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await BankAccount.findByPk(id);
    if (!account) {
      return res.status(404).json({ message: "Bank account not found" });
    }

    await account.destroy();
    return res.status(200).json({ message: "Bank account and associated transactions deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Direct Manual Deposit or Withdrawal (e.g. cash deposit into bank, cash withdrawal from ATM, profit/charges)
 */
export const depositWithdrawManual = async (req, res) => {
  try {
    const { bankAccountId, type, amount, category, reference, description, date } = req.body;

    if (!bankAccountId || !type || !amount) {
      return res.status(400).json({ error: "bankAccountId, type (deposit/withdrawal), and amount are required" });
    }

    const result = await recordBankTransaction({
      bankAccountId: Number(bankAccountId),
      type,
      amount: Number(amount),
      category: category || (type === "deposit" ? "Direct Deposit" : "Direct Withdrawal"),
      reference: reference || "",
      sourceEntity: "deposit",
      date: date || new Date().toISOString().slice(0, 10),
      description: description || `Manual ${type}`,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error performing manual bank transaction:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Inter-Bank Funds Transfer (From Bank A to Bank B)
 */
export const transferBetweenBanks = async (req, res) => {
  try {
    const { fromAccountId, toAccountId, amount, reference, description, date } = req.body;

    if (!fromAccountId || !toAccountId || !amount) {
      return res.status(400).json({ error: "fromAccountId, toAccountId, and amount are required." });
    }

    if (String(fromAccountId) === String(toAccountId)) {
      return res.status(400).json({ error: "Source and destination bank accounts cannot be the same." });
    }

    const numAmount = Number(amount);
    if (numAmount <= 0) {
      return res.status(400).json({ error: "Transfer amount must be greater than 0." });
    }

    const sourceBank = await BankAccount.findByPk(fromAccountId);
    const destBank = await BankAccount.findByPk(toAccountId);

    if (!sourceBank || !destBank) {
      return res.status(404).json({ error: "One or both bank accounts could not be found." });
    }

    const txDate = date || new Date().toISOString().slice(0, 10);
    const txRef = reference || `TXFR-${Date.now().toString().slice(-6)}`;

    // 1. Withdrawal from source bank
    const sourceRes = await recordBankTransaction({
      bankAccountId: sourceBank.id,
      type: "withdrawal",
      amount: numAmount,
      category: "Inter-Bank Transfer",
      reference: txRef,
      sourceEntity: "transfer",
      sourceId: destBank.id,
      date: txDate,
      description: description || `Transfer out to ${destBank.bankName} (${destBank.accountNumber})`,
    });

    // 2. Deposit into destination bank
    const destRes = await recordBankTransaction({
      bankAccountId: destBank.id,
      type: "deposit",
      amount: numAmount,
      category: "Inter-Bank Transfer",
      reference: txRef,
      sourceEntity: "transfer",
      sourceId: sourceBank.id,
      date: txDate,
      description: description || `Transfer in from ${sourceBank.bankName} (${sourceBank.accountNumber})`,
    });

    return res.status(200).json({
      message: `Successfully transferred PKR ${numAmount.toLocaleString()} from ${sourceBank.bankName} to ${destBank.bankName}`,
      sourceAccount: sourceRes.updatedAccount,
      destinationAccount: destRes.updatedAccount,
    });
  } catch (error) {
    console.error("Error executing bank transfer:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * List all bank transactions with pagination / filtering
 */
export const getAllBankTransactions = async (req, res) => {
  try {
    const { bankAccountId, date, type } = req.query;
    const where = {};

    if (bankAccountId) where.bankAccountId = Number(bankAccountId);
    if (type) where.type = type;
    if (date) where.date = date;

    const transactions = await BankTransaction.findAll({
      where,
      include: [
        {
          model: BankAccount,
          as: "bankAccount",
          attributes: ["id", "bankName", "accountTitle", "accountNumber"],
        },
      ],
      order: [["id", "DESC"]],
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching bank transactions:", error);
    return res.status(500).json({ error: error.message });
  }
};

