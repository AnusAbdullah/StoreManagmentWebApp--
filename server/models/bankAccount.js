import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const BankAccount = sequelize.define("BankAccount", {
  bankName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  iban: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  openingBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  currentBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Active", // "Active" | "Inactive"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export default BankAccount;

