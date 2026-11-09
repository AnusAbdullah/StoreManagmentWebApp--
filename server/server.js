import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import sequelize from "./database/db.js";
import userRoutes from "./routes/users.js";
import companyRoutes from "./routes/companies.js";
import customerRoutes from "./routes/customers.js";
import catagoryRoutes from "./routes/itemCatagory.js";
import itemRoutes from "./routes/items.js";
import partyRoutes from "./routes/parties.js";
import salessRoutes from "./routes/sales.js";
import accRecRoutes from "./routes/accReceivabe.js";
import accPayRoutes from "./routes/accPayable.js";
import purchasesRoutes from "./routes/purchases.js";
import expenseRoutes from "./routes/expenses.js";
import staffRoutes from "./routes/staff.js";
import dailyRegisterRoutes from "./routes/dailyRegister.js";
import salesReturnRoutes from "./routes/salesReturn.js";
import bankAccountRoutes from "./routes/bankAccounts.js";
import { signIn, createUser } from "./controller/users.js";
import "./models/index.js"; // Load all table relationships & foreign keys

dotenv.config();

const port = process.env.SERVER_PORT || 4001;
const app = express();

//! middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/user", userRoutes);
app.post("/signin", signIn);
app.post("/signup", createUser);
app.use("/company", companyRoutes);
app.use("/customer", customerRoutes);
app.use("/catagory", catagoryRoutes);
app.use("/item", itemRoutes);
app.use("/party", partyRoutes);
app.use("/sale", salessRoutes);
app.use("/accRec", accRecRoutes);
app.use("/accPay", accPayRoutes);
app.use("/purchase", purchasesRoutes);
app.use("/purchases", purchasesRoutes);
app.use("/expense", expenseRoutes);
app.use("/expenses", expenseRoutes);
app.use("/staff", staffRoutes);
app.use("/daily-register", dailyRegisterRoutes);
app.use("/sales-return", salesReturnRoutes);
app.use("/bank-accounts", bankAccountRoutes);
app.use("/bank", bankAccountRoutes);

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("connected to db...");
    try {
      await sequelize.sync();
    } catch (syncErr) {
      console.warn("Sequelize sync note:", syncErr.message);
    }
    app.listen(port, () => {
      console.log(`server listening on port http://localhost:${port}...`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
