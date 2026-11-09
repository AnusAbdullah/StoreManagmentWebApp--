import express from "express";
import {
  getDailyRegister,
  updateOpeningBalance,
  closeDailyRegister,
  reopenDailyRegister,
} from "../controller/dailyRegister.js";

const router = express.Router();

router.get("/", getDailyRegister);
router.post("/opening", updateOpeningBalance);
router.post("/close", closeDailyRegister);
router.post("/reopen", reopenDailyRegister);

export default router;

