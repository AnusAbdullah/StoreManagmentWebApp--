import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "webApp",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "anas",
  {
    dialect: process.env.DB_DIALECT || "mysql",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  }
);

sequelize
  .sync({ alter: false })
  .then(() => {
    console.log("Database and tables synced (or altered if necessary)");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

export default sequelize;
