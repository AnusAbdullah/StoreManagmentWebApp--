import { Sequelize, DataTypes } from "sequelize";

import sequelize from "../database/db.js";
const Item = sequelize.define("Item", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pattern: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  size: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  origin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dot: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  costPrice: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Optionally, you can synchronize the table to the database using:
// Item.sync();

// You can also define any associations or additional configurations here.

export default Item;
