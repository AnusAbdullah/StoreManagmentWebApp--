import sequelize from "../database/db.js";
import Customer from "./customers.js";
import Sale from "./sales.js";
import Item from "./items.js";
import Category from "./itemCatagory.js";
import Company from "./companies.js";
import Party from "./parties.js";
import Purchase from "./purchases.js";
import AccReceivable from "./accReceivabe.js";
import AccPayable from "./accPayable.js";
import Expense from "./expenses.js";
import Staff from "./staff.js";
import SalaryPayout from "./salaryPayout.js";
import User from "./users.js";
import DailyRegister from "./dailyRegister.js";
import SalesReturn from "./salesReturn.js";
import BankAccount from "./bankAccount.js";
import BankTransaction from "./bankTransaction.js";

// ─── Table Associations & Relationships ───────────────────
// 1. Customer <-> Sales
Customer.hasMany(Sale, { foreignKey: "customerId", as: "sales", onDelete: "SET NULL" });
Sale.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

// Customer <-> Sales Returns
Customer.hasMany(SalesReturn, { foreignKey: "customerId", as: "returns", onDelete: "SET NULL" });
SalesReturn.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

// Sale <-> Sales Returns
Sale.hasMany(SalesReturn, { foreignKey: "saleId", as: "returns", onDelete: "SET NULL" });
SalesReturn.belongsTo(Sale, { foreignKey: "saleId", as: "sale" });

// 2. Customer <-> Accounts Receivable (Khata)
Customer.hasOne(AccReceivable, { foreignKey: "customerId", as: "khata", onDelete: "CASCADE" });
AccReceivable.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });

// 3. Company / Supplier <-> Purchases
Company.hasMany(Purchase, { foreignKey: "supplierId", as: "purchases", onDelete: "SET NULL" });
Purchase.belongsTo(Company, { foreignKey: "supplierId", as: "company" });

// 4. Company / Supplier <-> Accounts Payable (Khata)
Company.hasOne(AccPayable, { foreignKey: "supplierId", as: "payableKhata", onDelete: "CASCADE" });
AccPayable.belongsTo(Company, { foreignKey: "supplierId", as: "company" });

// 5. Staff <-> Salary Payouts & Advances
Staff.hasMany(SalaryPayout, { foreignKey: "staffId", as: "payouts", onDelete: "CASCADE" });
SalaryPayout.belongsTo(Staff, { foreignKey: "staffId", as: "staff" });

// 6. Bank Account <-> Bank Transactions
BankAccount.hasMany(BankTransaction, { foreignKey: "bankAccountId", as: "transactions", onDelete: "CASCADE" });
BankTransaction.belongsTo(BankAccount, { foreignKey: "bankAccountId", as: "bankAccount" });

export {
  sequelize,
  Customer,
  Sale,
  Item,
  Category,
  Company,
  Party,
  Purchase,
  AccReceivable,
  AccPayable,
  Expense,
  Staff,
  SalaryPayout,
  User,
  DailyRegister,
  SalesReturn,
  BankAccount,
  BankTransaction,
};
