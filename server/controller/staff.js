import Staff from "../models/staff.js";
import SalaryPayout from "../models/salaryPayout.js";
import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { recordBankTransaction } from "./bankAccounts.js";

// ─── Staff Profiles ───────────────────────────
export const createStaff = async (req, res) => {
  try {
    const { name, phone, role, monthlySalary, hireDate, status } = req.body;
    const newRecord = await Staff.create({
      name: name || "Staff Member",
      phone: phone || "",
      role: role || "Salesman",
      monthlySalary: Number(monthlySalary || 0),
      hireDate: hireDate || new Date().toISOString().slice(0, 10),
      status: status || "Active",
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const allStaff = await Staff.findAll({
      include: [{ model: SalaryPayout, as: "payouts" }],
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(allStaff);
  } catch (error) {
    // If include fails, fallback to direct findAll
    try {
      const records = await Staff.findAll({ order: [["createdAt", "DESC"]] });
      res.status(200).json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

export const updateStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, monthlySalary, hireDate, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (monthlySalary !== undefined) updateData.monthlySalary = Number(monthlySalary);
    if (hireDate !== undefined) updateData.hireDate = hireDate;
    if (status !== undefined) updateData.status = status;

    const [affected] = await Staff.update(updateData, { where: { id } });
    if (affected === 0) {
      return res.status(404).json({ message: "Staff member not found" });
    }
    const updated = await Staff.findByPk(id);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteStaffById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Staff.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Staff record not found" });
    }
    await Staff.destroy({ where: { id } });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Salary Payouts & Advances ─────────────────
export const createSalaryPayout = async (req, res) => {
  try {
    const {
      staffId,
      staffName,
      amount,
      payoutType,
      month,
      date,
      note,
      paymentMethod,
      bankAccountId,
      bankName: inputBankName,
    } = req.body;

    let employeeName = staffName;
    if (!employeeName && staffId) {
      const emp = await Staff.findByPk(staffId);
      if (emp) employeeName = emp.name;
    }

    const chosenPaymentMethod = (paymentMethod || "cash").toLowerCase();
    let finalBankId = bankAccountId ? Number(bankAccountId) : null;
    let finalBankName = inputBankName || "";

    if (chosenPaymentMethod === "bank" && finalBankId && !finalBankName) {
      try {
        const bAcc = await BankAccount.findByPk(finalBankId);
        if (bAcc) finalBankName = bAcc.bankName;
      } catch (err) {
        console.warn("Could not find bank account for staff salary:", err.message);
      }
    }

    const newPayout = await SalaryPayout.create({
      staffId: staffId ? Number(staffId) : null,
      staffName: employeeName || "Staff Member",
      amount: Number(amount || 0),
      payoutType: payoutType || "Monthly Salary",
      month: month || new Date().toISOString().slice(0, 7),
      date: date || new Date().toISOString().slice(0, 10),
      note: note || "",
      paymentMethod: chosenPaymentMethod,
      bankAccountId: finalBankId,
      bankName: finalBankName,
    });

    // Auto-record bank withdrawal if paymentMethod is bank
    const payoutAmt = Number(amount || 0);
    if (chosenPaymentMethod === "bank" && finalBankId && payoutAmt > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: finalBankId,
          type: "withdrawal",
          amount: payoutAmt,
          category: `Staff ${payoutType || "Salary"}`,
          reference: `SAL-#${newPayout.id}`,
          sourceEntity: "salary",
          sourceId: newPayout.id,
          date: newPayout.date,
          description: `Staff salary payout to ${employeeName || "Staff Member"} (${payoutType || "Monthly Salary"})`,
        });
      } catch (bankErr) {
        console.error("Failed to auto-record bank transaction for salary payout:", bankErr.message);
      }
    }

    res.status(201).json(newPayout);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllSalaryPayouts = async (req, res) => {
  try {
    const allPayouts = await SalaryPayout.findAll({
      order: [["date", "DESC"], ["createdAt", "DESC"]],
    });
    res.status(200).json(allPayouts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSalaryPayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await SalaryPayout.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Payout record not found" });
    }

    // Revert bank balance and clean up ledger if salary was paid via bank
    if (record.bankAccountId && Number(record.amount || 0) > 0) {
      try {
        const bAcc = await BankAccount.findByPk(record.bankAccountId);
        if (bAcc) {
          bAcc.currentBalance = Number(bAcc.currentBalance || 0) + Number(record.amount);
          await bAcc.save();
        }
        await BankTransaction.destroy({
          where: {
            sourceEntity: "salary",
            sourceId: record.id,
          },
        });
      } catch (bankErr) {
        console.warn("Could not revert bank balance on salary payout deletion:", bankErr.message);
      }
    }

    await SalaryPayout.destroy({ where: { id } });
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
