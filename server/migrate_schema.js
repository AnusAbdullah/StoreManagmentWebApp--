import sequelize from "./database/db.js";
import { DataTypes } from "sequelize";
import AccPayable from "./models/accPayable.js";

async function runMigration() {
  try {
    await sequelize.authenticate();
    console.log("Connected to MySQL database.");

    const queryInterface = sequelize.getQueryInterface();

    // 1. Check & add customerId to sales table
    const salesTable = await queryInterface.describeTable("Sales").catch(() => null);
    if (salesTable) {
      if (!salesTable.customerId) {
        console.log("Adding customerId column to Sales table...");
        await queryInterface.addColumn("Sales", "customerId", {
          type: DataTypes.INTEGER,
          allowNull: true,
        });
        console.log("Successfully added customerId to Sales table.");
      } else {
        console.log("Sales table already has customerId column.");
      }
    }

    // 2. Check & add supplierId to purchases table
    const purchasesTable = await queryInterface.describeTable("Purchases").catch(() => null);
    if (purchasesTable) {
      if (!purchasesTable.supplierId) {
        console.log("Adding supplierId column to Purchases table...");
        await queryInterface.addColumn("Purchases", "supplierId", {
          type: DataTypes.INTEGER,
          allowNull: true,
        });
        console.log("Successfully added supplierId to Purchases table.");
      } else {
        console.log("Purchases table already has supplierId column.");
      }
    }

    // 3. Check & add customerId to accReceivables table
    const accRecTable = await queryInterface.describeTable("AccReceivables").catch(() => null);
    if (accRecTable) {
      if (!accRecTable.customerId) {
        console.log("Adding customerId column to AccReceivables table...");
        await queryInterface.addColumn("AccReceivables", "customerId", {
          type: DataTypes.INTEGER,
          allowNull: true,
        });
        console.log("Successfully added customerId to AccReceivables table.");
      } else {
        console.log("AccReceivables table already has customerId column.");
      }
    }

    // 4. Ensure AccPayables table exists
    await AccPayable.sync({ alter: false });
    console.log("AccPayables table verified / synced.");

    console.log("All schema migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error.message);
    process.exit(1);
  }
}

runMigration();
