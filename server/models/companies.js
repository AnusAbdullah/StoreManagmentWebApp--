import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";

const Company = sequelize.define("Company", {
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
});

// Optionally, you can synchronize the table to the database using:
// Company.sync();

// You can also define any associations or additional configurations here.

export default Company;
