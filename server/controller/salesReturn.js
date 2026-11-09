import SalesReturn from "../models/salesReturn.js";
import Item from "../models/items.js";
import AccReceivable from "../models/accReceivabe.js";
import Customer from "../models/customers.js";
import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { recordBankTransaction } from "./bankAccounts.js";

export const createSalesReturn = async (req, res) => {
  try {
    const {
      type = "return", // "return" or "exchange"
      saleId,
      invoiceNo,
      customerId,
      customerName = "Walk-in Customer",
      customerPhone,
      returnedItems = [],
      replacementItems = [],
      returnTotal = 0,
      replacementTotal = 0,
      netDifference = 0,
      settlementMode = "cash_refund",
      settledAmount = 0,
      reason = "Customer preference",
      date = new Date().toISOString().slice(0, 10),
      notes = "",
      bankAccountId,
      bankName: inputBankName,
    } = req.body;

    const prefix = type === "exchange" ? "EXC" : "RET";
    const returnNo = `${prefix}-${Date.now().toString().slice(-6)}`;

    // 1. Restock returned tyres back into warehouse inventory
    for (const retItem of returnedItems) {
      const q = Number(retItem.quantity || retItem.qty || 1);
      let matchedItem = null;

      if (retItem.itemId || retItem.id) {
        matchedItem = await Item.findByPk(retItem.itemId || retItem.id);
      }

      if (!matchedItem && retItem.size) {
        const candidateItems = await Item.findAll({ where: { size: retItem.size } });
        if (candidateItems.length > 0) {
          const targetBrand = (retItem.brand || "").toLowerCase().trim();
          matchedItem = candidateItems.find(
            (c) => (c.brand || "").toLowerCase().trim() === targetBrand
          ) || candidateItems[0];
        }
      }

      if (matchedItem) {
        matchedItem.quantity = Number(matchedItem.quantity || 0) + q;
        await matchedItem.save();
      }
    }

    // 2. If it's an exchange, deduct replacement tyres from warehouse inventory
    if (type === "exchange" && Array.isArray(replacementItems)) {
      for (const repItem of replacementItems) {
        const q = Number(repItem.quantity || repItem.qty || 1);
        let matchedItem = null;

        if (repItem.itemId || repItem.id) {
          matchedItem = await Item.findByPk(repItem.itemId || repItem.id);
        }

        if (!matchedItem && repItem.size) {
          const candidateItems = await Item.findAll({ where: { size: repItem.size } });
          if (candidateItems.length > 0) {
            const targetBrand = (repItem.brand || "").toLowerCase().trim();
            matchedItem = candidateItems.find(
              (c) => (c.brand || "").toLowerCase().trim() === targetBrand
            ) || candidateItems[0];
          }
        }

        if (matchedItem) {
          matchedItem.quantity = Math.max(0, Number(matchedItem.quantity || 0) - q);
          await matchedItem.save();
        }
      }
    }

    // 3. Customer Accounts Receivable (Khata) auto-reconciliation
    if (customerId || (customerName && customerName.toLowerCase() !== "walk-in customer")) {
      let accRecord = null;
      if (customerId) {
        accRecord = await AccReceivable.findOne({ where: { customerId } });
      }
      if (!accRecord && customerName) {
        accRecord = await AccReceivable.findOne({ where: { cname: customerName } });
      }

      if (settlementMode === "khata_credit") {
        // Customer returned tyre and credits their khata to reduce outstanding debt
        const creditAmt = Number(settledAmount || returnTotal || 0);
        if (accRecord) {
          const prevRem = Number(accRecord.remainingAmount || 0);
          accRecord.remainingAmount = Math.max(0, prevRem - creditAmt);

          let history = [];
          try {
            history = Array.isArray(accRecord.data) ? accRecord.data : JSON.parse(accRecord.data || "[]");
          } catch {
            history = [];
          }

          history.push({
            date: new Date().toISOString(),
            type: "Tyre Return Credit (Wapsi)",
            returnNo,
            invoiceNo: invoiceNo || "",
            amount: creditAmt,
            remainingAmount: accRecord.remainingAmount,
            note: `Returned tyres credited to ledger (${reason || "Customer Return"})`,
          });

          accRecord.data = history;
          await accRecord.save();
        }
      } else if (settlementMode === "customer_khata_due") {
        // Customer exchanged for a more expensive tyre and owes the difference on credit
        const debitAmt = Math.abs(Number(netDifference || 0));
        if (accRecord) {
          accRecord.remainingAmount = Number(accRecord.remainingAmount || 0) + debitAmt;

          let history = [];
          try {
            history = Array.isArray(accRecord.data) ? accRecord.data : JSON.parse(accRecord.data || "[]");
          } catch {
            history = [];
          }

          history.push({
            date: new Date().toISOString(),
            type: "Tyre Exchange Due (Tabdili)",
            returnNo,
            invoiceNo: invoiceNo || "",
            amount: debitAmt,
            remainingAmount: accRecord.remainingAmount,
            note: `Exchanged tyre difference added to ledger (${reason || "Product Exchange"})`,
          });

          accRecord.data = history;
          await accRecord.save();
        } else {
          // Create new Khata account for customer if none existed
          await AccReceivable.create({
            customerId: customerId || null,
            cname: customerName,
            remainingAmount: debitAmt,
            receivedTillNow: 0,
            receiveToday: 0,
            data: [
              {
                date: new Date().toISOString(),
                type: "Tyre Exchange Due (Tabdili)",
                returnNo,
                invoiceNo: invoiceNo || "",
                amount: debitAmt,
                remainingAmount: debitAmt,
                note: `Exchanged tyre difference added to ledger (${reason || "Product Exchange"})`,
              },
            ],
          });
        }
      }
    }

    // 4. Save SalesReturn record
    const newReturn = await SalesReturn.create({
      returnNo,
      type,
      saleId: saleId || null,
      invoiceNo: invoiceNo || null,
      customerId: customerId || null,
      customerName,
      customerPhone: customerPhone || "",
      returnedItems,
      replacementItems,
      returnTotal: Number(returnTotal || 0),
      replacementTotal: Number(replacementTotal || 0),
      netDifference: Number(netDifference || 0),
      settlementMode,
      settledAmount: Number(settledAmount || 0),
      reason,
      date,
      notes,
    });

    // 5. Auto-sync bank account if settled via bank
    if (bankAccountId) {
      const bId = Number(bankAccountId);
      if (settlementMode === "bank_refund") {
        const refAmt = Number(settledAmount || returnTotal || 0);
        if (refAmt > 0) {
          try {
            await recordBankTransaction({
              bankAccountId: bId,
              type: "withdrawal",
              amount: refAmt,
              category: "Customer Return Refund",
              reference: returnNo,
              sourceEntity: "salesReturn",
              sourceId: newReturn.id,
              date: date || new Date().toISOString().slice(0, 10),
              description: `Refund for return #${returnNo} (${customerName})`,
            });
          } catch (bankErr) {
            console.error("Failed to record bank transaction for return refund:", bankErr.message);
          }
        }
      } else if (settlementMode === "customer_paid_bank") {
        const diffAmt = Math.abs(Number(netDifference || 0));
        if (diffAmt > 0) {
          try {
            await recordBankTransaction({
              bankAccountId: bId,
              type: "deposit",
              amount: diffAmt,
              category: "Customer Exchange Payment",
              reference: returnNo,
              sourceEntity: "salesReturn",
              sourceId: newReturn.id,
              date: date || new Date().toISOString().slice(0, 10),
              description: `Exchange difference received for #${returnNo} (${customerName})`,
            });
          } catch (bankErr) {
            console.error("Failed to record bank transaction for exchange payment:", bankErr.message);
          }
        }
      }
    }

    return res.status(201).json(newReturn);
  } catch (error) {
    console.error("Error creating sales return:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getAllSalesReturns = async (req, res) => {
  try {
    const returns = await SalesReturn.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json(returns);
  } catch (error) {
    console.error("Error fetching sales returns:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSalesReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const returnRecord = await SalesReturn.findByPk(id);
    if (!returnRecord) {
      return res.status(404).json({ error: "Return record not found" });
    }

    // Revert inventory adjustments:
    // Deduct returned items that were added
    const returnedItems = Array.isArray(returnRecord.returnedItems)
      ? returnRecord.returnedItems
      : JSON.parse(returnRecord.returnedItems || "[]");

    for (const item of returnedItems) {
      const q = Number(item.quantity || item.qty || 1);
      if (item.itemId) {
        const dbItem = await Item.findByPk(item.itemId);
        if (dbItem) {
          dbItem.quantity = Math.max(0, Number(dbItem.quantity || 0) - q);
          await dbItem.save();
        }
      }
    }

    // Add back replacement items that were deducted
    if (returnRecord.type === "exchange") {
      const repItems = Array.isArray(returnRecord.replacementItems)
        ? returnRecord.replacementItems
        : JSON.parse(returnRecord.replacementItems || "[]");

      for (const item of repItems) {
        const q = Number(item.quantity || item.qty || 1);
        if (item.itemId) {
          const dbItem = await Item.findByPk(item.itemId);
          if (dbItem) {
            dbItem.quantity = Number(dbItem.quantity || 0) + q;
            await dbItem.save();
          }
        }
      }
    }

    // Revert bank account balance and delete ledger transaction if settled via bank
    try {
      const bankTx = await BankTransaction.findOne({
        where: { sourceEntity: "salesReturn", sourceId: returnRecord.id },
      });
      if (bankTx) {
        const bAcc = await BankAccount.findByPk(bankTx.bankAccountId);
        if (bAcc) {
          if (bankTx.type === "withdrawal") {
            // It was a bank refund, deposit money back
            bAcc.currentBalance = Number(bAcc.currentBalance || 0) + Number(bankTx.amount || 0);
          } else if (bankTx.type === "deposit") {
            // It was an exchange payment into bank, withdraw money back
            bAcc.currentBalance = Math.max(0, Number(bAcc.currentBalance || 0) - Number(bankTx.amount || 0));
          }
          await bAcc.save();
        }
        await bankTx.destroy();
      }
    } catch (bankErr) {
      console.warn("Could not revert bank balance on return deletion:", bankErr.message);
    }

    await returnRecord.destroy();
    return res.status(200).json({ message: "Return record deleted, inventory restored, and bank funds synced" });
  } catch (error) {
    console.error("Error deleting sales return:", error);
    return res.status(500).json({ error: error.message });
  }
};

