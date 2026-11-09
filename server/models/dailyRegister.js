import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const DailyRegister = sequelize.define("DailyRegister", {
  date: {
    type: DataTypes.STRING, // "YYYY-MM-DD"
    allowNull: false,
    unique: true,
  },
  openingBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  closingBalance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  actualCash: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  cashDifference: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING, // "open" | "closed"
    defaultValue: "open",
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  closedBy: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

export default DailyRegister;

