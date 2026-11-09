import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const SalesReturn = sequelize.define("SalesReturn", {
  returnNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.STRING, // "return" or "exchange"
    allowNull: false,
    defaultValue: "return",
  },
  saleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  invoiceNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Walk-in Customer",
  },
  customerPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  returnedItems: {
    type: DataTypes.JSON, // array of { itemId, brand, pattern, size, quantity, unitPrice, lineTotal }
    allowNull: false,
    defaultValue: [],
  },
  replacementItems: {
    type: DataTypes.JSON, // array of { itemId, brand, pattern, size, quantity, unitPrice, lineTotal }
    allowNull: true,
    defaultValue: [],
  },
  returnTotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  replacementTotal: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  netDifference: {
    type: DataTypes.FLOAT, // replacementTotal - returnTotal
    allowNull: false,
    defaultValue: 0,
  },
  settlementMode: {
    type: DataTypes.STRING, // "cash_refund", "khata_credit", "customer_paid_cash", "customer_khata_due", "even_exchange"
    allowNull: false,
    defaultValue: "cash_refund",
  },
  settledAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default SalesReturn;

