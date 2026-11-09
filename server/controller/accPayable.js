import AccPayable from "../models/accPayable.js";
import { recordBankTransaction } from "./bankAccounts.js";

export const createAccountPayable = async (req, res) => {
  try {
    const { supplierId, supplierType, supplierName, data, paidTillNow, paidToday, remainingAmount } = req.body;
    const newRecord = await AccPayable.create({
      supplierId: supplierId ? Number(supplierId) : null,
      supplierType: supplierType || "company",
      supplierName: supplierName || "Supplier",
      data: data || [],
      paidTillNow: Number(paidTillNow || 0),
      paidToday: Number(paidToday || 0),
      remainingAmount: Number(remainingAmount || 0),
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAccountPayables = async (req, res) => {
  try {
    const allRecords = await AccPayable.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAccountPayableById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AccPayable.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAccountPayableById = async (req, res) => {
  try {
    const {
      supplierId,
      supplierType,
      supplierName,
      data,
      paidTillNow,
      paidToday,
      remainingAmount,
      paymentMethod,
      bankAccountId,
      bankName,
      note,
    } = req.body;
    const { id } = req.params;
    const updateFields = {};
    if (supplierId !== undefined) updateFields.supplierId = Number(supplierId);
    if (supplierType !== undefined) updateFields.supplierType = supplierType;
    if (supplierName !== undefined) updateFields.supplierName = supplierName;
    if (data !== undefined) updateFields.data = data;
    if (paidTillNow !== undefined) updateFields.paidTillNow = Number(paidTillNow);
    if (paidToday !== undefined) updateFields.paidToday = Number(paidToday);
    if (remainingAmount !== undefined) updateFields.remainingAmount = Number(remainingAmount);

    const [affectedRows] = await AccPayable.update(updateFields, { where: { id } });
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const updatedRecord = await AccPayable.findByPk(id);

    // Auto-sync bank withdrawal if payment method is bank
    const paidAmt = Number(paidToday || 0);
    const chosenMethod = (paymentMethod || "").toLowerCase();
    const bId = bankAccountId ? Number(bankAccountId) : null;
    if ((chosenMethod === "bank" || bId) && bId && paidAmt > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: bId,
          type: "withdrawal",
          amount: paidAmt,
          category: "Supplier Khata Payment",
          reference: `KHATA-SUPP-${id}`,
          sourceEntity: "accPayable",
          sourceId: Number(id),
          date: new Date().toISOString().slice(0, 10),
          description: `Khata debt payment to ${updatedRecord.supplierName || "Supplier"}${note ? ` (${note})` : ""}`,
        });
      } catch (bErr) {
        console.error("Failed to record bank payable withdrawal:", bErr.message);
      }
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAccountPayableById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await AccPayable.findByPk(id);
    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }
    await AccPayable.destroy({ where: { id } });
    res.status(200).json(deletedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
