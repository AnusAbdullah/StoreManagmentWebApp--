import express from "express";
import {
  createStaff,
  getAllStaff,
  updateStaffById,
  deleteStaffById,
  createSalaryPayout,
  getAllSalaryPayouts,
  deleteSalaryPayoutById,
} from "../controller/staff.js";

const router = express.Router();

router
  .post("/", createStaff)
  .get("/all", getAllStaff)
  .put("/:id", updateStaffById)
  .delete("/:id", deleteStaffById)
  .post("/payout", createSalaryPayout)
  .get("/payout/all", getAllSalaryPayouts)
  .delete("/payout/:id", deleteSalaryPayoutById);

export default router;
