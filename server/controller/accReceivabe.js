import AccReceivable from "../models/accReceivabe.js";
import Customer from "../models/customers.js";
import { recordBankTransaction } from "./bankAccounts.js";

export const createAccountReceivable = async (req, res) => {
  try {
    const { customerId, cname, data, receivedTillNow, receiveToday, remainingAmount } = req.body;
    let custId = customerId ? Number(customerId) : null;
    const customerName = (cname || "General Customer").trim();

    // Auto-link or auto-create Customer in Customers table
    if (!custId && customerName && customerName.toLowerCase() !== "general customer") {
      let existingCust = await Customer.findOne({ where: { name: customerName } });
      if (!existingCust) {
        existingCust = await Customer.create({
          name: customerName,
          phone: "",
          address: "Opened via Khata Ledger",
        });
      }
      if (existingCust) {
        custId = existingCust.id;
      }
    }

    const newRecord = await AccReceivable.create({
      customerId: custId,
      cname: customerName,
      data: data || [],
      receivedTillNow: Number(receivedTillNow || 0),
      receiveToday: Number(receiveToday || 0),
      remainingAmount: Number(remainingAmount || 0),
    });
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAccountReceivables = async (req, res) => {
  try {
    const allRecords = await AccReceivable.findAll();
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAccountReceivableById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AccReceivable.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAccountReceivableById = async (req, res) => {
  try {
    const {
      cname,
      data,
      receivedTillNow,
      receiveToday,
      remainingAmount,
      paymentMethod,
      bankAccountId,
      bankName,
      note,
    } = req.body;
    const { id } = req.params;
    const updateFields = {};
    if (cname !== undefined) updateFields.cname = cname;
    if (data !== undefined) updateFields.data = data;
    if (receivedTillNow !== undefined) updateFields.receivedTillNow = Number(receivedTillNow);
    if (receiveToday !== undefined) updateFields.receiveToday = Number(receiveToday);
    if (remainingAmount !== undefined) updateFields.remainingAmount = Number(remainingAmount);

    const [affectedRows] = await AccReceivable.update(updateFields, { where: { id } });
    if (affectedRows === 0) {
      return res.status(404).json({ message: "Record not found" });
    }

    const updatedRecord = await AccReceivable.findByPk(id);

    // Auto-sync bank deposit if payment method is bank
    const recAmt = Number(receiveToday || 0);
    const chosenMethod = (paymentMethod || "").toLowerCase();
    const bId = bankAccountId ? Number(bankAccountId) : null;
    if ((chosenMethod === "bank" || bId) && bId && recAmt > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: bId,
          type: "deposit",
          amount: recAmt,
          category: "Customer Khata Recovery",
          reference: `KHATA-CUST-${id}`,
          sourceEntity: "accReceivable",
          sourceId: Number(id),
          date: new Date().toISOString().slice(0, 10),
          description: `Khata debt recovery from ${updatedRecord.cname || "Customer"}${note ? ` (${note})` : ""}`,
        });
      } catch (bErr) {
        console.error("Failed to record bank recovery deposit:", bErr.message);
      }
    }

    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAccountReceivableById = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRecord = await AccReceivable.findByPk(id);
    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }
    await AccReceivable.destroy({ where: { id } });
    res.status(200).json(deletedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
