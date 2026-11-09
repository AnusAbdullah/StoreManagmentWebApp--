import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const SalaryPayout = sequelize.define("SalaryPayout", {
  staffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  staffName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  payoutType: {
    type: DataTypes.STRING,
    defaultValue: "Monthly Salary", // "Monthly Salary", "Advance", "Commission / Bonus"
  },
  month: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    defaultValue: "cash", // "cash" or "bank"
  },
  bankAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default SalaryPayout;
