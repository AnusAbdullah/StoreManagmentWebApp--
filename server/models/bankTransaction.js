import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const BankTransaction = sequelize.define("BankTransaction", {
  bankAccountId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // "deposit" | "withdrawal"
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  balanceAfter: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Direct Deposit",
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sourceEntity: {
    type: DataTypes.STRING,
    allowNull: true, // "sale" | "purchase" | "accReceivable" | "accPayable" | "expense" | "salaryPayout" | "transfer" | "adjustment"
  },
  sourceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default BankTransaction;

