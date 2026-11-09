import { Sequelize, DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Staff = sequelize.define("Staff", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Salesman",
  },
  monthlySalary: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  hireDate: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: "Active",
  },
});

export default Staff;
