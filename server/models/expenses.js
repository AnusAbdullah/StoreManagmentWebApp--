import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Expense = sequelize.define("Expense", {
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Shop Utilities",
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentMode: {
    type: DataTypes.STRING,
    defaultValue: "Cash",
  },
  bankAccountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bankName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

export default Expense;
