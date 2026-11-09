import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";

const Sale = sequelize.define("Sale", {
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cname: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicleNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicleModel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  data: {
    type: DataTypes.JSON, // JSON data type can store arrays of items sold
    allowNull: true,
  },
  totalBill: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  receivedAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  remainingAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  profit: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  status: {
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
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
});

// Optionally, you can synchronize the table to the database using:
// Sale.sync();

// You can also define any associations or additional configurations here.

export default Sale;
