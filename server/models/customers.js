import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";

const Customer = sequelize.define("Customer", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cnic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Optionally, you can synchronize the table to the database using:
// Customer.sync();

// You can also define any associations or additional configurations here.

export default Customer;
