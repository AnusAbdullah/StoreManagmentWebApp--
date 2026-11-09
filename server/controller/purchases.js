import Purchase from "../models/purchases.js";
import Item from "../models/items.js";
import AccPayable from "../models/accPayable.js";
import BankAccount from "../models/bankAccount.js";
import BankTransaction from "../models/bankTransaction.js";
import { recordBankTransaction } from "./bankAccounts.js";
import { Op } from "sequelize";

export const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      supplierType,
      invoiceNo,
      date,
      supplierName,
      contact,
      items,
      totalAmount,
      paid,
      remaining,
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

    const itemsList = Array.isArray(items)
      ? items
      : typeof items === "string"
      ? JSON.parse(items || "[]")
      : [];

    // Automatically increase stock for each purchased tyre item with strict AND matching
    for (const itemRow of itemsList) {
      const brand = (itemRow.brand || "").trim();
      const pattern = (itemRow.pattern || itemRow.name || "").trim();
      const size = String(itemRow.size || "").trim();
      const origin = (itemRow.origin || "").trim();
      const dot = (itemRow.dot || "").trim();
      const category = itemRow.category || "Passenger Car";
      const costPrice = Number(itemRow.costPrice || itemRow.price || 0);
      const sellingPrice = Number(itemRow.sellingPrice || (costPrice > 0 ? costPrice * 1.25 : 0));
      const purchasedQty = Number(itemRow.quantity || itemRow.qty || 0);

      if (size && purchasedQty > 0) {
        // Strict matching: size + brand (if present) + pattern (if present)
        const andConditions = [{ size: size }];
        if (brand) {
          andConditions.push({ brand: brand });
        }
        if (pattern) {
          andConditions.push({
            [Op.or]: [
              { pattern: pattern },
              { name: { [Op.like]: `%${pattern}%` } },
            ],
          });
        }

        let existingItem = await Item.findOne({
          where: { [Op.and]: andConditions },
        });

        if (existingItem) {
          existingItem.quantity = Number(existingItem.quantity || 0) + purchasedQty;
          if (costPrice > 0) existingItem.costPrice = costPrice;
          if (sellingPrice > 0 && !existingItem.price) existingItem.price = sellingPrice;
          if (dot) existingItem.dot = dot;
          if (origin) existingItem.origin = origin;
          await existingItem.save();
        } else {
          // Create new tyre item in inventory
          await Item.create({
            name: `${brand} ${pattern}`.trim() || `Tyre ${size}`,
            brand: brand || "",
            pattern: pattern || "",
            size: size,
            category: category,
            origin: origin || "",
            dot: dot || "",
            costPrice: costPrice,
            price: sellingPrice,
            quantity: purchasedQty,
          });
        }
      }
    }

    const calculatedRemaining = Math.max(0, Number(totalAmount || 0) - Number(paid || 0));
    const suppId = supplierId ? Number(supplierId) : null;
    const finalSupplierName = supplierName || "Supplier";
    const finalSupplierType = supplierType || "company";

    const newPurchase = await Purchase.create({
      supplierId: suppId,
      supplierType: finalSupplierType,
      invoiceNo: invoiceNo || `PINV-${Date.now().toString().slice(-6)}`,
      date: date || new Date().toISOString().slice(0, 10),
      supplierName: finalSupplierName,
      contact: contact || "",
      items: itemsList,
      totalAmount: Number(totalAmount || 0),
      paid: Number(paid || 0),
      remaining: calculatedRemaining,
      status: status || (calculatedRemaining <= 0 ? "Paid" : "Partial"),
      paymentMethod: chosenPaymentMethod,
      bankAccountId: finalBankId,
      bankName: finalBankName,
    });

    // Auto-sync bank withdrawal if payment method is bank
    const paidAmount = Number(paid || 0);
    if (chosenPaymentMethod === "bank" && finalBankId && paidAmount > 0) {
      try {
        await recordBankTransaction({
          bankAccountId: finalBankId,
          type: "withdrawal",
          amount: paidAmount,
          category: "Supplier Purchase Payment",
          reference: `PINV-${newPurchase.invoiceNo || newPurchase.id}`,
          sourceEntity: "purchase",
          sourceId: newPurchase.id,
          date: newPurchase.date || new Date().toISOString().slice(0, 10),
          description: `Stock purchase payment to ${finalSupplierName} (Inv #${newPurchase.invoiceNo})`,
        });
      } catch (bankErr) {
        console.error("Failed to auto-record bank transaction for purchase:", bankErr.message);
      }
    }

    // Auto-sync remaining supplier balance to Accounts Payable
    if (calculatedRemaining > 0) {
      const transactionEntry = {
        purchaseId: newPurchase.id,
        invoiceNo: newPurchase.invoiceNo,
        date: newPurchase.date || new Date().toISOString(),
        items: itemsList,
        totalAmount: Number(totalAmount || 0),
        paidToday: Number(paid || 0),
        remainingAmount: calculatedRemaining,
      };

      let existingPayable = null;
      if (suppId) {
        existingPayable = await AccPayable.findOne({
          where: { supplierId: suppId, supplierType: finalSupplierType },
        });
      }
      if (!existingPayable && finalSupplierName) {
        existingPayable = await AccPayable.findOne({
          where: { supplierName: finalSupplierName },
        });
      }

      if (existingPayable) {
        let history = [];
        try {
          history = Array.isArray(existingPayable.data)
            ? existingPayable.data
            : typeof existingPayable.data === "string"
            ? JSON.parse(existingPayable.data || "[]")
            : [];
        } catch {
          history = [];
        }
        history.push(transactionEntry);

        if (!existingPayable.supplierId && suppId) {
          existingPayable.supplierId = suppId;
          existingPayable.supplierType = finalSupplierType;
        }
        existingPayable.data = history;
        existingPayable.paidTillNow = Number(existingPayable.paidTillNow || 0) + Number(paid || 0);
        existingPayable.paidToday = Number(paid || 0);
        existingPayable.remainingAmount = Number(existingPayable.remainingAmount || 0) + calculatedRemaining;
        await existingPayable.save();
      } else {
        await AccPayable.create({
          supplierId: suppId,
          supplierType: finalSupplierType,
          supplierName: finalSupplierName,
          data: [transactionEntry],
          paidTillNow: Number(paid || 0),
          paidToday: Number(paid || 0),
          remainingAmount: calculatedRemaining,
        });
      }
    }

    res.status(201).json(newPurchase);
  } catch (error) {
    console.error("Error creating purchase invoice:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const purchase = await Purchase.findByPk(id);
    if (!purchase) {
      return res.status(404).json({ message: "Purchase record not found" });
    }

    // Revert added stock
    const itemsList = Array.isArray(purchase.items)
      ? purchase.items
      : typeof purchase.items === "string"
      ? JSON.parse(purchase.items || "[]")
      : [];

    for (const itemRow of itemsList) {
      const brand = itemRow.brand || "";
      const size = String(itemRow.size || "");
      const purchasedQty = Number(itemRow.quantity || itemRow.qty || 0);

      if (size && purchasedQty > 0) {
        const existingItem = await Item.findOne({
          where: {
            [Op.and]: [
              { brand: brand || "" },
              { size: size },
            ],
          },
        });

        if (existingItem) {
          existingItem.quantity = Math.max(0, Number(existingItem.quantity || 0) - purchasedQty);
          await existingItem.save();
        }
      }
    }

    // Revert bank balance and clean up ledger if purchase was paid via bank
    if (purchase.bankAccountId && Number(purchase.paid || 0) > 0) {
      try {
        const bAcc = await BankAccount.findByPk(purchase.bankAccountId);
        if (bAcc) {
          bAcc.currentBalance = Number(bAcc.currentBalance || 0) + Number(purchase.paid);
          await bAcc.save();
        }
        await BankTransaction.destroy({
          where: {
            sourceEntity: "purchase",
            sourceId: purchase.id,
          },
        });
      } catch (bankErr) {
        console.warn("Could not revert bank balance on purchase deletion:", bankErr.message);
      }
    }

    // Revert supplier khata payable debt if there was remaining balance
    const remAmt = Number(purchase.remaining || 0);
    if (remAmt > 0) {
      try {
        let payable = null;
        if (purchase.supplierId) {
          payable = await AccPayable.findOne({
            where: { supplierId: purchase.supplierId, supplierType: purchase.supplierType || "company" },
          });
        }
        if (!payable && purchase.supplierName) {
          payable = await AccPayable.findOne({
            where: { supplierName: purchase.supplierName },
          });
        }

        if (payable) {
          payable.remainingAmount = Math.max(0, Number(payable.remainingAmount || 0) - remAmt);
          let history = [];
          try {
            history = Array.isArray(payable.data) ? payable.data : JSON.parse(payable.data || "[]");
          } catch {
            history = [];
          }
          // Filter out the purchase entry
          payable.data = history.filter((h) => String(h.purchaseId) !== String(purchase.id) && h.invoiceNo !== purchase.invoiceNo);
          await payable.save();
        }
      } catch (payErr) {
        console.warn("Could not revert supplier khata on purchase deletion:", payErr.message);
      }
    }

    await purchase.destroy();
    res.status(200).json({ message: "Purchase record deleted, stock adjusted, and financial ledgers synced" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
