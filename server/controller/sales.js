// const { Sales } = require("../models/sales.js"); // Assuming you have a model defined for Sales

import Sales from "../models/sales.js";
import Item from "../models/items.js";
import Customer from "../models/customers.js";
import AccReceivable from "../models/accReceivabe.js";
import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { recordBankTransaction } from "./bankAccounts.js";
import { Op } from "sequelize";

export const createSalesRecord = async (req, res) => {
  try {
    const {
      customerId,
      cname,
      phone,
      vehicleNo,
      vehicleModel,
      data,
      totalBill,
      receivedAmount,
      remainingAmount,
      status,
      paymentMethod,
      bankAccountId,
      bankName: inputBankName,
    } = req.body;

    const chosenPaymentMethod = (paymentMethod || "cash").toLowerCase();
    let finalBankId = bankAccountId ? Number(bankAccountId) : null;
    let finalBankName = inputBankName || "";

    if (chosenPaymentMethod === "bank" && finalBankId && !finalBankName) {
      try {
        const bAcc = await BankAccount.findByPk(finalBankId);
        if (bAcc) finalBankName = bAcc.bankName;
      } catch (err) {
        console.warn("Could not find bank account name:", err.message);
      }
    }

    let totalCogs = 0;
    const itemsList = Array.isArray(data)
      ? data
      : typeof data === "string"
      ? JSON.parse(data || "[]")
      : [];

    // Auto-deduct stock for each sold tyre item and calculate COGS
    for (const itemRow of itemsList) {
      let itemId = null;
      let itemName = "";
      let itemSize = "";
      let soldQty = 0;

      if (Array.isArray(itemRow)) {
        itemName = itemRow[0] || "";
        itemSize = String(itemRow[1] || "");
        soldQty = Number(itemRow[3] || 0);
        if (itemRow[4]) itemId = itemRow[4];
      } else if (typeof itemRow === "object" && itemRow !== null) {
        itemId = itemRow.itemId || itemRow.id || null;
        itemName = itemRow.itemName || itemRow.name || "";
        itemSize = String(itemRow.size || "");
        soldQty = Number(itemRow.quantity || itemRow.qty || 0);
      }

      if (soldQty > 0) {
        let matchedItem = null;
        if (itemId) {
          matchedItem = await Item.findByPk(itemId);
        }

        // Fallback to fuzzy search if itemId not found or not provided
        if (!matchedItem && itemName) {
          let candidateItems = itemSize
            ? await Item.findAll({ where: { size: itemSize } })
            : await Item.findAll();

          if (candidateItems.length === 0) {
            candidateItems = await Item.findAll();
          }

          const normItemName = itemName.toLowerCase().trim();
          matchedItem = candidateItems.find((ci) => {
            const b = (ci.brand || "").toLowerCase().trim();
            const n = (ci.name || "").toLowerCase().trim();
            const p = (ci.pattern || "").toLowerCase().trim();
            const fullName = `${b} ${p || n}`.trim();
            return (
              normItemName === fullName ||
              normItemName === n ||
              normItemName === b ||
              (b && normItemName.includes(b)) ||
              (n && normItemName.includes(n)) ||
              (p && normItemName.includes(p))
            );
          });

          if (!matchedItem && candidateItems.length === 1 && itemSize) {
            matchedItem = candidateItems[0];
          }
        }

        if (matchedItem) {
          const cost = Number(matchedItem.costPrice || 0);
          totalCogs += cost * soldQty;

          // Auto-deduct stock (never drop below 0)
          matchedItem.quantity = Math.max(0, Number(matchedItem.quantity || 0) - soldQty);
          await matchedItem.save();
        }
      }
    }

    const calculatedProfit = Math.max(0, Number(totalBill || 0) - totalCogs);
    const rem = Number(remainingAmount || 0);
    const rec = Number(receivedAmount !== undefined ? receivedAmount : (req.body.recievedAmount !== undefined ? req.body.recievedAmount : 0));
    const bill = Number(totalBill || 0);
    const customerName = (cname || "").trim() || "Walk-in Customer";
    let custId = customerId ? Number(customerId) : null;

    // If customerId is not yet assigned and a real customer name is entered, find or auto-create customer profile
    if (!custId && customerName && customerName.toLowerCase() !== "walk-in customer") {
      let existingCust = null;
      if (phone && phone.trim()) {
        existingCust = await Customer.findOne({ where: { phone: phone.trim() } });
      }
      if (!existingCust) {
        existingCust = await Customer.findOne({ where: { name: customerName } });
      }
      if (!existingCust) {
        existingCust = await Customer.create({
          name: customerName,
          phone: phone ? phone.trim() : "",
          address: vehicleNo ? `Vehicle: ${vehicleNo}${vehicleModel ? ` (${vehicleModel})` : ""}` : "",
        });
      }
      if (existingCust) {
        custId = existingCust.id;
      }
    }

    const newRecord = await Sales.create({
      customerId: custId,
      cname: customerName,
      phone: phone || "",
      vehicleNo: vehicleNo || "",
      vehicleModel: vehicleModel || "",
      data: itemsList,
      totalBill: bill,
      receivedAmount: rec,
      remainingAmount: rem,
      profit: calculatedProfit,
      status: (status && status !== "cash") ? status : (rem > 0 ? (rec > 0 ? "partial" : "account") : (chosenPaymentMethod === "bank" ? "bank" : "cash")),
      paymentMethod: chosenPaymentMethod,
      bankAccountId: finalBankId,
      bankName: finalBankName,
    });

    // Auto-sync bank deposit if payment method is bank
    if (chosenPaymentMethod === "bank" && finalBankId && rec > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: finalBankId,
          type: "deposit",
          amount: rec,
          category: "Tyre Sale Payment",
          reference: `INV-#${newRecord.id}`,
          sourceEntity: "sale",
          sourceId: newRecord.id,
          date: new Date().toISOString().slice(0, 10),
          description: `Sale payment received for Invoice #${newRecord.id} (${customerName})`,
        });
      } catch (bankErr) {
        console.error("Failed to auto-record bank transaction for sale:", bankErr.message);
      }
    }

    // If there is any remaining unpaid balance, automatically add it to Customer Accounts Receivable ledger!
    if (rem > 0) {
      const transactionEntry = {
        invoiceId: newRecord.id,
        date: new Date().toISOString(),
        phone: phone || "",
        vehicleNo: vehicleNo || "",
        vehicleModel: vehicleModel || "",
        items: itemsList,
        totalBill: bill,
        receivedToday: rec,
        remainingAmount: rem,
      };

      let existingAccount = null;
      if (custId) {
        existingAccount = await AccReceivable.findOne({
          where: { customerId: custId },
        });
      }
      if (!existingAccount && customerName) {
        existingAccount = await AccReceivable.findOne({
          where: { cname: customerName },
        });
      }

      if (existingAccount) {
        let history = [];
        try {
          history = Array.isArray(existingAccount.data)
            ? existingAccount.data
            : typeof existingAccount.data === "string"
            ? JSON.parse(existingAccount.data || "[]")
            : [];
        } catch {
          history = [];
        }
        history.push(transactionEntry);

        if (!existingAccount.customerId && custId) {
          existingAccount.customerId = custId;
        }
        existingAccount.data = history;
        existingAccount.receivedTillNow = Number(existingAccount.receivedTillNow || 0) + rec;
        existingAccount.receiveToday = rec;
        existingAccount.remainingAmount = Number(existingAccount.remainingAmount || 0) + rem;
        await existingAccount.save();
      } else {
        await AccReceivable.create({
          customerId: custId,
          cname: customerName,
          data: [transactionEntry],
          receivedTillNow: rec,
          receiveToday: rec,
          remainingAmount: rem,
        });
      }
    }

    res.status(201).json(newRecord);
  } catch (error) {
    console.error("Error creating sales record:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllSalesRecords = async (req, res) => {
  try {
    const allRecords = await Sales.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSalesRecordByName = async (req, res) => {
  try {
    const { cname } = req.body;
    const record = await Sales.findOne({ where: { cname } });
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSalesRecordById = async (req, res) => {
  try {
    const { data, totalBill, receivedAmount, remainingAmount, status, phone, vehicleNo, vehicleModel } =
      req.body;

    const record = await Sales.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (data !== undefined) record.data = data;
    if (totalBill !== undefined) record.totalBill = Number(totalBill);
    if (receivedAmount !== undefined) record.receivedAmount = Number(receivedAmount);
    if (remainingAmount !== undefined) record.remainingAmount = Number(remainingAmount);
    if (status !== undefined) record.status = status;
    if (phone !== undefined) record.phone = phone;
    if (vehicleNo !== undefined) record.vehicleNo = vehicleNo;
    if (vehicleModel !== undefined) record.vehicleModel = vehicleModel;

    await record.save();

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSalesRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await Sales.findByPk(id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Restore stock if data exists
    const itemsList = Array.isArray(record.data)
      ? record.data
      : typeof record.data === "string"
      ? JSON.parse(record.data || "[]")
      : [];

    for (const itemRow of itemsList) {
      let itemId = null;
      let itemName = "";
      let itemSize = "";
      let soldQty = 0;

      if (Array.isArray(itemRow)) {
        itemName = itemRow[0] || "";
        itemSize = String(itemRow[1] || "");
        soldQty = Number(itemRow[3] || 0);
        if (itemRow[4]) itemId = itemRow[4];
      } else if (typeof itemRow === "object" && itemRow !== null) {
        itemId = itemRow.itemId || itemRow.id || null;
        itemName = itemRow.itemName || itemRow.name || "";
        itemSize = String(itemRow.size || "");
        soldQty = Number(itemRow.quantity || itemRow.qty || 0);
      }

      if (soldQty > 0) {
        let matchedItem = null;
        if (itemId) {
          matchedItem = await Item.findByPk(itemId);
        }

        if (!matchedItem && itemName) {
          let candidateItems = itemSize
            ? await Item.findAll({ where: { size: itemSize } })
            : await Item.findAll();

          if (candidateItems.length === 0) {
            candidateItems = await Item.findAll();
          }

          const normItemName = itemName.toLowerCase().trim();
          matchedItem = candidateItems.find((ci) => {
            const b = (ci.brand || "").toLowerCase().trim();
            const n = (ci.name || "").toLowerCase().trim();
            const p = (ci.pattern || "").toLowerCase().trim();
            const fullName = `${b} ${p || n}`.trim();
            return (
              normItemName === fullName ||
              normItemName === n ||
              normItemName === b ||
              (b && normItemName.includes(b)) ||
              (n && normItemName.includes(n)) ||
              (p && normItemName.includes(p))
            );
          });

          if (!matchedItem && candidateItems.length === 1 && itemSize) {
            matchedItem = candidateItems[0];
          }
        }

        if (matchedItem) {
          matchedItem.quantity = Number(matchedItem.quantity || 0) + soldQty;
          await matchedItem.save();
        }
      }
    }

    // Revert bank balance and clean up ledger if sale payment was deposited to bank
    if (record.bankAccountId && Number(record.receivedAmount || 0) > 0) {
      try {
        const bAcc = await BankAccount.findByPk(record.bankAccountId);
        if (bAcc) {
          bAcc.currentBalance = Math.max(0, Number(bAcc.currentBalance || 0) - Number(record.receivedAmount));
          await bAcc.save();
        }
        await BankTransaction.destroy({
          where: {
            sourceEntity: "sale",
            sourceId: record.id,
          },
        });
      } catch (bankErr) {
        console.warn("Could not revert bank balance on sale deletion:", bankErr.message);
      }
    }

    // Revert customer khata debt if there was remaining balance
    const remAmt = Number(record.remainingAmount || 0);
    if (remAmt > 0) {
      try {
        let receivable = null;
        if (record.customerId) {
          receivable = await AccReceivable.findOne({ where: { customerId: record.customerId } });
        }
        if (!receivable && record.cname) {
          receivable = await AccReceivable.findOne({ where: { cname: record.cname } });
        }

        if (receivable) {
          receivable.remainingAmount = Math.max(0, Number(receivable.remainingAmount || 0) - remAmt);
          let history = [];
          try {
            history = Array.isArray(receivable.data) ? receivable.data : JSON.parse(receivable.data || "[]");
          } catch {
            history = [];
          }
          receivable.data = history.filter((h) => String(h.saleId) !== String(record.id) && String(h.id) !== String(record.id));
          await receivable.save();
        }
      } catch (recErr) {
        console.warn("Could not revert customer khata on sale deletion:", recErr.message);
      }
    }

    await record.destroy();

    res.status(200).json({ message: `Deleted sales record ${id}, restored inventory, and synced financial ledgers` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
