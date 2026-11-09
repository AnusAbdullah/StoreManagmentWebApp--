import express from "express";
import {
  createAccountPayable,
  getAllAccountPayables,
  getAccountPayableById,
  updateAccountPayableById,
  deleteAccountPayableById,
} from "../controller/accPayable.js";

const router = express.Router();

router
  .post("/", createAccountPayable)
  .get("/all", getAllAccountPayables)
  .get("/:id", getAccountPayableById)
  .put("/:id", updateAccountPayableById)
  .delete("/:id", deleteAccountPayableById);

export default router;
