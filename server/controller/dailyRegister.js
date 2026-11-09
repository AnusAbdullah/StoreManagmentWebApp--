import DailyRegister from "../models/dailyRegister.js";
import Sale from "../models/sales.js";
import Expense from "../models/expenses.js";
import SalaryPayout from "../models/salaryPayout.js";
import SalesReturn from "../models/salesReturn.js";
import Purchase from "../models/purchases.js";
import AccReceivable from "../models/accReceivabe.js";
import AccPayable from "../models/accPayable.js";
import BankTransaction from "../models/bankTransaction.js";
import BankAccount from "../models/bankAccount.js";
import { Op } from "sequelize";

const matchesDate = (dateVal, targetDate) => {
  if (!dateVal || !targetDate) return false;
  const str = String(dateVal);
  if (str.slice(0, 10) === targetDate) return true;
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      // PKT (UTC+5) offset
      const pkt = new Date(d.getTime() + 5 * 3600 * 1000).toISOString().slice(0, 10);
      if (pkt === targetDate) return true;
      const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (local === targetDate) return true;
    }
  } catch {}
  return false;
};

export const getDailyRegister = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);

    // 1. Find or create daily register record
    let [register, created] = await DailyRegister.findOrCreate({
      where: { date },
      defaults: {
        date,
        openingBalance: 0,
        closingBalance: 0,
        actualCash: 0,
        cashDifference: 0,
        status: "open",
        notes: "",
      },
    });

    // If newly created and opening balance is 0, attempt to auto-carry forward previous day's closing cash
    if (created && Number(register.openingBalance || 0) === 0) {
      try {
        const prevRegister = await DailyRegister.findOne({
          where: { date: { [Op.lt]: date } },
          order: [["date", "DESC"]],
        });
        if (prevRegister) {
          const carriedCash = Number(prevRegister.actualCash || prevRegister.closingBalance || 0);
          if (carriedCash > 0) {
            register.openingBalance = carriedCash;
            await register.save();
          }
        }
      } catch (err) {
        console.warn("Could not carry forward previous day's balance:", err.message);
      }
    }

    // 2. Fetch all sales for this date
    const allSales = await Sale.findAll({
      order: [["createdAt", "DESC"]],
    });

    // Filter sales matching date using matchesDate helper
    const salesForDay = allSales.filter((s) => matchesDate(s.createdAt, date));

    let totalSalesBill = 0;
    let totalCashReceived = 0; // drawer cash
    let totalBankSalesReceived = 0; // bank collections
    let totalCreditRemaining = 0;

    salesForDay.forEach((s) => {
      totalSalesBill += Number(s.totalBill || 0);
      const rec = Number(s.receivedAmount || 0);
      if (s.paymentMethod === "bank") {
        totalBankSalesReceived += rec;
      } else {
        totalCashReceived += rec;
      }
      totalCreditRemaining += Number(s.remainingAmount || 0);
    });

    // 3. Fetch all expenses for this date
    const allExpenses = await Expense.findAll({
      order: [["createdAt", "DESC"]],
    });
    const expensesForDay = allExpenses.filter((e) => matchesDate(e.date || e.createdAt, date));
    let totalExpenses = 0; // cash expenses from drawer
    let totalBankExpenses = 0; // paid via bank transfer/cheque

    const expenseBreakdown = {};
    expensesForDay.forEach((e) => {
      const amt = Number(e.amount || 0);
      const cat = e.category || "Shop Utilities";
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + amt;

      const isBank = (e.paymentMode || "").toLowerCase() !== "cash" || Boolean(e.bankAccountId);
      if (isBank) {
        totalBankExpenses += amt;
      } else {
        totalExpenses += amt;
      }
    });

    // 4. Fetch all staff salary & advance payouts for this date
    const allPayouts = await SalaryPayout.findAll({
      order: [["createdAt", "DESC"]],
    });
    const staffPayoutsForDay = allPayouts.filter((p) => matchesDate(p.date || p.createdAt, date));
    let totalStaffPayouts = 0; // cash from drawer
    let totalBankStaffPayouts = 0; // bank transfer

    staffPayoutsForDay.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.paymentMethod === "bank" || p.bankAccountId) {
        totalBankStaffPayouts += amt;
      } else {
        totalStaffPayouts += amt;
      }
    });

    // 4b. Fetch all purchase invoices (stock-in payments) for this date
    let purchasesForDay = [];
    let totalPurchasePaid = 0; // cash from drawer
    let totalBankPurchasePaid = 0; // paid from bank account
    try {
      const allPurchases = await Purchase.findAll({
        order: [["createdAt", "DESC"]],
      });
      purchasesForDay = allPurchases.filter((p) => matchesDate(p.date || p.createdAt, date));

      purchasesForDay.forEach((p) => {
        const amt = Number(p.paid || 0);
        if (p.paymentMethod === "bank" || p.bankAccountId) {
          totalBankPurchasePaid += amt;
        } else {
          totalPurchasePaid += amt;
        }
      });
    } catch (err) {
      console.warn("Purchases query skipped or failed:", err.message);
    }

    // 5. Fetch all customer returns & product exchanges for this date
    let returnsForDay = [];
    let totalCashRefundsGiven = 0;
    let totalBankRefundsGiven = 0;
    let totalExchangeCashReceived = 0;
    let totalExchangeBankReceived = 0;

    try {
      const allReturns = await SalesReturn.findAll({
        order: [["createdAt", "DESC"]],
      });
      returnsForDay = allReturns.filter((r) => matchesDate(r.date || r.createdAt, date));

      returnsForDay.forEach((r) => {
        if (r.type === "return") {
          const refAmt = Number(r.settledAmount || r.returnTotal || 0);
          if (r.settlementMode === "cash_refund") {
            totalCashRefundsGiven += refAmt;
          } else if (r.settlementMode === "bank_refund") {
            totalBankRefundsGiven += refAmt;
          }
        } else if (r.type === "exchange") {
          const diff = Number(r.netDifference || 0);
          if (diff < 0) {
            const absDiff = Math.abs(diff);
            if (r.settlementMode === "cash_refund") {
              totalCashRefundsGiven += absDiff;
            } else if (r.settlementMode === "bank_refund") {
              totalBankRefundsGiven += absDiff;
            }
          } else if (diff > 0) {
            if (r.settlementMode === "customer_paid_cash") {
              totalExchangeCashReceived += diff;
            } else if (r.settlementMode === "customer_paid_bank") {
              totalExchangeBankReceived += diff;
            }
          }
        }
      });
    } catch (err) {
      console.warn("Returns query skipped or failed:", err.message);
    }

    // 5b. Fetch Customer Khata Recoveries for this date
    let customerRecoveriesForDay = [];
    let totalCustomerKhataRecoveries = 0; // cash drawer
    let totalBankCustomerRecoveries = 0; // bank
    try {
      const allReceivables = await AccReceivable.findAll();
      for (const rec of allReceivables) {
        const history = Array.isArray(rec.data)
          ? rec.data
          : typeof rec.data === "string"
          ? JSON.parse(rec.data || "[]")
          : [];
        for (const entry of history) {
          const recAmt = Number(entry.receivedToday || 0);
          if (matchesDate(entry.date, date) && recAmt > 0 && entry.type !== "Sales Invoice") {
            const isBank = entry.paymentMethod === "bank" || Boolean(entry.bankAccountId);
            if (isBank) {
              totalBankCustomerRecoveries += recAmt;
            } else {
              totalCustomerKhataRecoveries += recAmt;
            }
            customerRecoveriesForDay.push({
              customerName: rec.cname,
              customerId: rec.customerId,
              amount: recAmt,
              type: entry.type || (isBank ? "Bank Recovery" : "Cash Recovery"),
              paymentMethod: isBank ? "bank" : "cash",
              bankName: entry.bankName || "",
              note: entry.note || "Khata debt recovery received",
              time: entry.date ? new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
            });
          }
        }
      }
    } catch (err) {
      console.warn("AccReceivable recoveries query skipped or failed:", err.message);
    }

    // 5c. Fetch Supplier Khata Payments made for this date
    let supplierKhataPaymentsForDay = [];
    let totalSupplierKhataPaid = 0; // cash drawer
    let totalBankSupplierPaid = 0; // bank
    try {
      const allPayables = await AccPayable.findAll();
      for (const pay of allPayables) {
        const history = Array.isArray(pay.data)
          ? pay.data
          : typeof pay.data === "string"
          ? JSON.parse(pay.data || "[]")
          : [];
        for (const entry of history) {
          const paidAmt = Number(entry.paidToday || 0);
          const isSupplierPayment =
            entry.type === "Payment to Supplier" ||
            entry.type === "Bank Payment to Supplier" ||
            (paidAmt > 0 && !entry.purchaseId && !entry.totalAmount);

          if (matchesDate(entry.date, date) && paidAmt > 0 && isSupplierPayment) {
            const isBank = entry.paymentMethod === "bank" || Boolean(entry.bankAccountId);
            if (isBank) {
              totalBankSupplierPaid += paidAmt;
            } else {
              totalSupplierKhataPaid += paidAmt;
            }
            supplierKhataPaymentsForDay.push({
              supplierName: pay.supplierName,
              supplierType: pay.supplierType || "company",
              supplierId: pay.supplierId,
              amount: paidAmt,
              type: entry.type || (isBank ? "Bank Payment to Supplier" : "Cash Payment to Supplier"),
              paymentMethod: isBank ? "bank" : "cash",
              bankName: entry.bankName || "",
              note: entry.note || "Khata payment to supplier",
              time: entry.date ? new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-",
            });
          }
        }
      }
    } catch (err) {
      console.warn("AccPayable payments query skipped or failed:", err.message);
    }

    // 5d. Fetch Bank Transactions for this date
    let bankTransactionsForDay = [];
    try {
      const allBankTxs = await BankTransaction.findAll({
        include: [
          {
            model: BankAccount,
            as: "bankAccount",
            attributes: ["id", "bankName", "accountNumber", "accountTitle"],
          },
        ],
        order: [["id", "DESC"]],
      });
      bankTransactionsForDay = allBankTxs.filter((tx) => matchesDate(tx.date || tx.createdAt, date));
    } catch (err) {
      console.warn("Bank transactions query skipped:", err.message);
    }

    // 6. Calculate Net Drawer Cash & Expected Closing Balance (Physical Cash Drawer Float)
    const openingBal = Number(register.openingBalance || 0);
    const totalInflows = totalCashReceived + totalExchangeCashReceived + totalCustomerKhataRecoveries;
    const totalOutflows = totalExpenses + totalStaffPayouts + totalCashRefundsGiven + totalPurchasePaid + totalSupplierKhataPaid;
    const expectedClosingCash = Math.round((openingBal + totalInflows - totalOutflows) * 100) / 100;

    // Bank summary calculations: ensure all ledger transactions are counted
    let totalOtherBankDeposits = 0;
    let totalOtherBankWithdrawals = 0;

    bankTransactionsForDay.forEach((tx) => {
      const isKnownDeposit = tx.sourceEntity === "sale" || tx.category === "Customer Khata Recovery" || tx.category === "Tyre Sale Payment";
      const isKnownWithdrawal = tx.sourceEntity === "purchase" || tx.sourceEntity === "expense" || tx.sourceEntity === "salary" || tx.category === "Supplier Khata Payment";

      if (tx.type === "deposit" && !isKnownDeposit) {
        totalOtherBankDeposits += Number(tx.amount || 0);
      } else if (tx.type === "withdrawal" && !isKnownWithdrawal) {
        totalOtherBankWithdrawals += Number(tx.amount || 0);
      }
    });

    const totalBankInflows = totalBankSalesReceived + totalBankCustomerRecoveries + totalExchangeBankReceived + totalOtherBankDeposits;
    const totalBankOutflows = totalBankPurchasePaid + totalBankExpenses + totalBankStaffPayouts + totalBankSupplierPaid + totalBankRefundsGiven + totalOtherBankWithdrawals;
    const netBankChange = totalBankInflows - totalBankOutflows;

    // If register is still open, keep closingBalance synced with expected cash
    if (register.status === "open") {
      register.closingBalance = expectedClosingCash;
      await register.save();
    }

    const actualCash = Number(register.actualCash || 0);
    const cashDifference = register.status === "closed" ? Math.round((actualCash - expectedClosingCash) * 100) / 100 : 0;

    return res.status(200).json({
      register,
      date,
      summary: {
        date,
        openingBalance: openingBal,
        totalSalesBill,
        totalCashReceived,
        totalCreditRemaining,
        totalExchangeCashReceived,
        totalCustomerKhataRecoveries,
        totalInflows,
        totalExpenses,
        totalStaffPayouts,
        totalPurchasePaid,
        totalSupplierKhataPaid,
        totalCashRefundsGiven,
        totalOutflows,
        netCashChange: totalInflows - totalOutflows,
        expectedClosingCash,
        actualCash,
        cashDifference,
        status: register.status,
        closedAt: register.closedAt,
        notes: register.notes,
        // Bank metrics
        totalBankSalesReceived,
        totalBankCustomerRecoveries,
        totalBankPurchasePaid,
        totalBankExpenses,
        totalBankStaffPayouts,
        totalBankSupplierPaid,
        totalBankInflows,
        totalBankOutflows,
        netBankChange,
        // Combined shop aggregates
        grandTotalInflows: totalInflows + totalBankInflows,
        grandTotalOutflows: totalOutflows + totalBankOutflows,
        grandTotalRevenue: totalCashReceived + totalBankSalesReceived,
        grandTotalTurnover: totalSalesBill,
      },
      expenseBreakdown,
      sales: salesForDay,
      expenses: expensesForDay,
      staffPayouts: staffPayoutsForDay,
      purchases: purchasesForDay,
      customerRecoveries: customerRecoveriesForDay,
      supplierPayments: supplierKhataPaymentsForDay,
      returns: returnsForDay,
      bankTransactions: bankTransactionsForDay,
    });
  } catch (error) {
    console.error("Error fetching daily register:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateOpeningBalance = async (req, res) => {
  try {
    const { date, openingBalance, notes } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    let [register] = await DailyRegister.findOrCreate({
      where: { date },
      defaults: {
        date,
        openingBalance: Number(openingBalance || 0),
        closingBalance: Number(openingBalance || 0),
        actualCash: 0,
        cashDifference: 0,
        status: "open",
        notes: notes || "",
      },
    });

    register.openingBalance = Number(openingBalance || 0);
    if (notes !== undefined) register.notes = notes;
    await register.save();

    return res.status(200).json({ message: "Opening balance updated successfully", register });
  } catch (error) {
    console.error("Error updating opening balance:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const closeDailyRegister = async (req, res) => {
  try {
    const { date, actualCash, notes, closedBy } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const register = await DailyRegister.findOne({ where: { date } });
    if (!register) {
      return res.status(404).json({ error: "Daily register not found for this date" });
    }

    const expectedCash = Number(register.closingBalance || 0);
    const countedCash = Number(actualCash !== undefined ? actualCash : expectedCash);
    const difference = Math.round((countedCash - expectedCash) * 100) / 100;

    register.status = "closed";
    register.actualCash = countedCash;
    register.cashDifference = difference;
    register.closedAt = new Date();
    if (notes !== undefined) register.notes = notes;
    if (closedBy) register.closedBy = closedBy;
    await register.save();

    return res.status(200).json({ message: "Daily register closed successfully", register });
  } catch (error) {
    console.error("Error closing daily register:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const reopenDailyRegister = async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const register = await DailyRegister.findOne({ where: { date } });
    if (!register) {
      return res.status(404).json({ error: "Daily register not found for this date" });
    }

    register.status = "open";
    register.closedAt = null;
    await register.save();

    return res.status(200).json({ message: "Daily register reopened successfully", register });
  } catch (error) {
    console.error("Error reopening daily register:", error);
    return res.status(500).json({ error: error.message });
  }
};

