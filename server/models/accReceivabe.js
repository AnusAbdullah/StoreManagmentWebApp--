import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";
const AccReceivable = sequelize.define("AccReceivable", {
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cname: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON, // You can use JSON data type to store a multi-dimensional array
    allowNull: false,
  },
  receivedTillNow: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  receiveToday: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  remainingAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
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

// Optionally, you can synchronize the table to the database using:
// AccReceivable.sync();

// You can also define any associations or additional configurations here.

export default AccReceivable;
