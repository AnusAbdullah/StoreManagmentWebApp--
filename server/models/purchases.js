import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Purchase = sequelize.define("Purchase", {
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  supplierType: {
    type: DataTypes.STRING,
    defaultValue: "company", // "company" or "party"
  },
  invoiceNo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  items: {
    type: DataTypes.JSON, // Array of tyre items purchased
    allowNull: true,
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  paid: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  remaining: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Received",
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
});

export default Purchase;
