import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const AccPayable = sequelize.define("AccPayable", {
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  supplierType: {
    type: DataTypes.STRING,
    defaultValue: "company", // "company" or "party"
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  paidTillNow: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  paidToday: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  remainingAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    allowNull: false,
  },
});

export default AccPayable;
