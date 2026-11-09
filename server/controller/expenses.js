import Expense from "../models/expenses.js";
import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { recordBankTransaction } from "./bankAccounts.js";

export const createExpense = async (req, res) => {
  try {
    const {
      category,
      title,
      amount,
      date,
      paymentMode,
      remarks,
      bankAccountId,
      bankName: inputBankName,
    } = req.body;

    const chosenPaymentMode = paymentMode || "Cash";
    let finalBankId = bankAccountId ? Number(bankAccountId) : null;
    let finalBankName = inputBankName || "";

    if (finalBankId && !finalBankName) {
      try {
        const bAcc = await BankAccount.findByPk(finalBankId);
        if (bAcc) finalBankName = bAcc.bankName;
      } catch (err) {
        console.warn("Could not find bank account for expense:", err.message);
      }
    }

    const newRecord = await Expense.create({
      category: category || "General Expense",
      title: title || "Shop Expense",
      amount: Number(amount || 0),
      date: date || new Date().toISOString().slice(0, 10),
      paymentMode: chosenPaymentMode,
      bankAccountId: finalBankId,
      bankName: finalBankName,
      remarks: remarks || "",
    });

    // If paid via bank transfer, cheque, online, or bank account selected, auto-record withdrawal
    const expAmt = Number(amount || 0);
    const isBankMode = chosenPaymentMode.toLowerCase() !== "cash" || Boolean(finalBankId);
    if (isBankMode && finalBankId && expAmt > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: finalBankId,
          type: "withdrawal",
          amount: expAmt,
          category: `Expense: ${category || "General"}`,
          reference: `EXP-#${newRecord.id}`,
          sourceEntity: "expense",
          sourceId: newRecord.id,
          date: newRecord.date,
          description: `${title || "Shop Expense"} (${category || "General"}) - ${remarks || chosenPaymentMode}`,
        });
      } catch (bankErr) {
        console.error("Failed to auto-record bank transaction for expense:", bankErr.message);
      }
    }

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const allRecords = await Expense.findAll({
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, title, amount, date, paymentMode, remarks } = req.body;
    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = Number(amount);
    if (date !== undefined) updateData.date = date;
    if (paymentMode !== undefined) updateData.paymentMode = paymentMode;
    if (remarks !== undefined) updateData.remarks = remarks;

    const [affected] = await Expense.update(updateData, { where: { id } });
    if (affected === 0) {
      return res.status(404).json({ message: "Expense record not found" });
    }
    const updated = await Expense.findByPk(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Expense.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    // Revert bank balance and clean up ledger if expense was paid via bank
    if (record.bankAccountId && Number(record.amount || 0) > 0) {
      try {
        const bAcc = await BankAccount.findByPk(record.bankAccountId);
        if (bAcc) {
          bAcc.currentBalance = Number(bAcc.currentBalance || 0) + Number(record.amount);
          await bAcc.save();
        }
        await BankTransaction.destroy({
          where: {
            sourceEntity: "expense",
            sourceId: record.id,
          },
        });
      } catch (bankErr) {
        console.warn("Could not revert bank balance on expense deletion:", bankErr.message);
      }
    }

    await Expense.destroy({ where: { id } });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
