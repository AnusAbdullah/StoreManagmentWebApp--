import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";
const Party = sequelize.define("Party", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true, // Adjust this based on your requirements
  },
  cnic: {
    type: DataTypes.STRING,
    allowNull: true, // Adjust this based on your requirements
  },
});

// Optionally, you can synchronize the table to the database using:
// Party.sync();

// You can also define any associations or additional configurations here.
export default Party;
