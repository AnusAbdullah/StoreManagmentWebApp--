import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Button,
  Chip,
  Stack,
  TextField,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import LockResetRoundedIcon from "@mui/icons-material/LockResetRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";

import dailyRegisterApi from "../api/DailyRegisterApi";

export default function DailyRegister({ setRender }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [registerData, setRegisterData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Opening Balance Modal State
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [openingInput, setOpeningInput] = useState("");
  const [openingNotes, setOpeningNotes] = useState("");

  // Closing Register Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [actualCashInput, setActualCashInput] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closedByInput, setClosedByInput] = useState("Manager");

  // Print Sheet Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Sale Breakdown Modal State
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  const fetchRegister = useCallback(async (date) => {
    try {
      setLoading(true);
      const res = await dailyRegisterApi.getDailyRegister(date);
      setRegisterData(res.data);
      if (res.data?.register) {
        setOpeningInput(String(res.data.register.openingBalance || 0));
        setOpeningNotes(res.data.register.notes || "");
        setActualCashInput(
          res.data.register.actualCash ? String(res.data.register.actualCash) : String(res.data.summary?.expectedClosingCash || 0)
        );
      }
    } catch (err) {
      console.error("Failed to load daily register:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegister(selectedDate);
  }, [selectedDate, fetchRegister]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSetQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleSaveOpening = async () => {
    try {
      await dailyRegisterApi.updateOpeningBalance({
        date: selectedDate,
        openingBalance: Number(openingInput || 0),
        notes: openingNotes,
      });
      setOpenModalOpen(false);
      fetchRegister(selectedDate);
    } catch (err) {
      alert("Error saving opening balance: " + err.message);
    }
  };

  const handleCloseRegister = async () => {
    try {
      await dailyRegisterApi.closeDailyRegister({
        date: selectedDate,
        actualCash: Number(actualCashInput || 0),
        notes: closeNotes,
        closedBy: closedByInput,
      });
      setCloseModalOpen(false);
      fetchRegister(selectedDate);
    } catch (err) {
      alert("Error closing register: " + err.message);
    }
  };

  const handleReopenRegister = async () => {
    if (window.confirm("Are you sure you want to reopen this day's register to make adjustments?")) {
      try {
        await dailyRegisterApi.reopenDailyRegister({ date: selectedDate });
        fetchRegister(selectedDate);
      } catch (err) {
        alert("Error reopening register: " + err.message);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = registerData?.summary || {};
  const register = registerData?.register || {};
  const isClosed = register.status === "closed";

  const opening = Number(summary.openingBalance || 0);
  const inflows = Number(summary.totalInflows || 0);
  const outflows = Number(summary.totalOutflows || 0);
  const expectedCash = Number(summary.expectedClosingCash || 0);
  const actualCash = Number(summary.actualCash || 0);
  const diff = Number(summary.cashDifference || 0);

  const bankInflows = Number(summary.totalBankInflows || 0);
  const bankOutflows = Number(summary.totalBankOutflows || 0);
  const bankSales = Number(summary.totalBankSalesReceived || 0);
  const bankKhataRec = Number(summary.totalBankCustomerRecoveries || 0);
  const totalCashSales = Number(summary.totalCashReceived || 0);
  const totalSalesRevenue = Number(summary.grandTotalRevenue || (totalCashSales + bankSales));
  const grandInflows = Number(summary.grandTotalInflows || (inflows + bankInflows));
  const grandOutflows = Number(summary.grandTotalOutflows || (outflows + bankOutflows));
  const netBank = Number(summary.netBankChange || (bankInflows - bankOutflows));

  return (
    <Box sx={{ pb: 6 }}>
      {/* ─── HEADER / ACTION BAR ─── */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.4)",
        }}
      >
        <Grid container alignItems="center" spacing={2.5}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <AccountBalanceWalletRoundedIcon sx={{ color: "#38bdf8", fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                Daily Cash Register & Rooznamcha
              </Typography>
              <Chip
                label={isClosed ? "CLOSED" : "OPEN / ACTIVE"}
                size="small"
                sx={{
                  bgcolor: isClosed ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)",
                  color: isClosed ? "#fca5a5" : "#6ee7b7",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: "1px solid",
                  borderColor: isClosed ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)",
                }}
              />
            </Stack>
            <Typography variant="body2" sx={{ color: "#94a3b8", maxWidth: 600 }}>
              Live counter drawer reconciliation: Track morning float, cash collections from tyre sales, petty expenses, staff disbursements, and day-end closing count.
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
            >
              {/* Date Input */}
              <Box
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  p: 0.8,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <CalendarMonthRoundedIcon sx={{ color: "#94a3b8", mr: 1, ml: 0.5, fontSize: 20 }} />
                <TextField
                  type="date"
                  size="small"
                  value={selectedDate}
                  onChange={handleDateChange}
                  sx={{
                    "& .MuiInputBase-input": {
                      color: "#ffffff",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      p: 0.5,
                    },
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  }}
                />
              </Box>

              {/* Quick Day Selectors */}
              <Stack direction="row" spacing={0.8}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSetQuickDate(0)}
                  sx={{
                    borderColor: selectedDate === new Date().toISOString().slice(0, 10) ? "#38bdf8" : "rgba(255,255,255,0.25)",
                    color: selectedDate === new Date().toISOString().slice(0, 10) ? "#38bdf8" : "#e2e8f0",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    fontSize: "0.75rem",
                  }}
                >
                  Today
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleSetQuickDate(1)}
                  sx={{
                    borderColor: "rgba(255,255,255,0.25)",
                    color: "#e2e8f0",
                    fontWeight: 700,
                    textTransform: "none",
                    borderRadius: 2,
                    fontSize: "0.75rem",
                  }}
                >
                  Yesterday
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<PrintRoundedIcon />}
                  onClick={() => setPrintModalOpen(true)}
                  sx={{
                    bgcolor: "#38bdf8",
                    color: "#0f172a",
                    fontWeight: 800,
                    textTransform: "none",
                    borderRadius: 2,
                    fontSize: "0.8rem",
                    "&:hover": { bgcolor: "#0284c7", color: "#ffffff" },
                  }}
                >
                  Print Sheet
                </Button>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {loading ? (
        <Box sx={{ py: 10, textAlign: "center" }}>
          <CircularProgress size={42} sx={{ color: "#4f46e5" }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontWeight: 600 }}>
            Loading Day Register for {selectedDate}...
          </Typography>
        </Box>
      ) : (
        <>
          {/* ─── 4 MAIN STAT CARDS ─── */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            {/* 1. Morning Opening Cash */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "rgba(79, 70, 229, 0.2)",
                  background: "linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(99, 102, 241, 0.01) 100%)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#4f46e5", letterSpacing: "0.05em" }}>
                    MORNING OPENING FLOAT
                  </Typography>
                  {!isClosed && (
                    <IconButton
                      size="small"
                      onClick={() => setOpenModalOpen(true)}
                      sx={{ color: "#4f46e5", bgcolor: "rgba(79, 70, 229, 0.1)" }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#1e1b4b" }}>
                  PKR {opening.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Cash sitting in till at start of morning
                </Typography>
              </Paper>
            </Grid>

            {/* 2. Today's Collections & Inflows */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "rgba(16, 185, 129, 0.25)",
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(52, 211, 153, 0.01) 100%)",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#059669", letterSpacing: "0.05em" }}>
                    TOTAL COLLECTIONS (CASH + BANK)
                  </Typography>
                  <TrendingUpRoundedIcon sx={{ color: "#10b981", fontSize: 22 }} />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#065f46" }}>
                  + PKR {grandInflows.toLocaleString()}
                </Typography>
                <Stack spacing={0.3} sx={{ mt: 0.8 }}>
                  <Typography variant="caption" sx={{ color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                    <span>💵 Till: +{inflows.toLocaleString()}</span>
                    <span>•</span>
                    <span>🏦 Bank: +{bankInflows.toLocaleString()}</span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.74rem" }}>
                    {registerData?.sales?.length || 0} sales (PKR {totalSalesRevenue.toLocaleString()}){summary.totalCustomerKhataRecoveries > 0 || bankKhataRec > 0 ? ` • Khata: PKR ${(Number(summary.totalCustomerKhataRecoveries || 0) + bankKhataRec).toLocaleString()}` : ""}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* 3. Today's Outflows */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "rgba(239, 68, 68, 0.25)",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(244, 63, 94, 0.01) 100%)",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#dc2626", letterSpacing: "0.05em" }}>
                    TOTAL OUTFLOWS (CASH + BANK)
                  </Typography>
                  <TrendingDownRoundedIcon sx={{ color: "#ef4444", fontSize: 22 }} />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#991b1b" }}>
                  - PKR {grandOutflows.toLocaleString()}
                </Typography>
                <Stack spacing={0.3} sx={{ mt: 0.8 }}>
                  <Typography variant="caption" sx={{ color: "#b91c1c", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                    <span>💵 Till: -{outflows.toLocaleString()}</span>
                    <span>•</span>
                    <span>🏦 Bank: -{bankOutflows.toLocaleString()}</span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.74rem" }}>
                    Stock: PKR {(Number(summary.totalPurchasePaid || 0) + Number(summary.totalBankPurchasePaid || 0)).toLocaleString()} • Bills: PKR {(Number(summary.totalExpenses || 0) + Number(summary.totalBankExpenses || 0)).toLocaleString()}{Number(summary.totalStaffPayouts || 0) + Number(summary.totalBankStaffPayouts || 0) > 0 ? ` • Staff: PKR ${(Number(summary.totalStaffPayouts || 0) + Number(summary.totalBankStaffPayouts || 0)).toLocaleString()}` : ""}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* 4. Expected / Actual Closing Cash */}
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: isClosed ? "#10b981" : "#0284c7",
                  background: isClosed
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.02) 100%)"
                    : "linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(14, 165, 233, 0.02) 100%)",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, color: isClosed ? "#047857" : "#0284c7", letterSpacing: "0.05em" }}
                  >
                    {isClosed ? "ACTUAL CASH AT CLOSING" : "CLOSING DRAWER CASH"}
                  </Typography>
                  <SavingsRoundedIcon sx={{ color: isClosed ? "#10b981" : "#0284c7", fontSize: 22 }} />
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 900, color: isClosed ? "#064e3b" : "#0369a1" }}>
                  PKR {(isClosed ? actualCash : expectedCash).toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  {isClosed ? (
                    diff === 0 ? (
                      <span style={{ color: "#10b981", fontWeight: 700 }}>✓ Drawer Perfectly Balanced</span>
                    ) : diff > 0 ? (
                      <span style={{ color: "#0284c7", fontWeight: 700 }}>+ PKR {diff.toLocaleString()} Cash Excess</span>
                    ) : (
                      <span style={{ color: "#ef4444", fontWeight: 700 }}>- PKR {Math.abs(diff).toLocaleString()} Shortage</span>
                    )
                  ) : (
                    <span>Till: PKR {expectedCash.toLocaleString()} • Bank: {netBank >= 0 ? "+" : ""}PKR {netBank.toLocaleString()}</span>
                  )}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* ─── DUAL-CHANNEL CASH VS BANK FUNDS STRIP ─── */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 3,
              border: "1px solid rgba(79, 70, 229, 0.2)",
              bgcolor: "rgba(79, 70, 229, 0.03)",
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "rgba(16, 185, 129, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#059669",
                    }}
                  >
                    <SavingsRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Physical Cash Drawer (Till)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
                      PKR {expectedCash.toLocaleString()}{" "}
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>
                        (+{inflows.toLocaleString()} in / -{outflows.toLocaleString()} out)
                      </span>
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4.5}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "rgba(79, 70, 229, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#4f46e5",
                    }}
                  >
                    <AccountBalanceRoundedIcon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Bank Transfers Received Today (Sales & Khata)
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#4338ca" }}>
                      + PKR {bankInflows.toLocaleString()}{" "}
                      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>
                        (Sales: PKR {bankSales.toLocaleString()} | Khata: PKR {bankKhataRec.toLocaleString()})
                      </span>
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={4} sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={{ xs: "flex-start", md: "flex-end" }}
                  alignItems="center"
                >
                  <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                      Bank Outflows: - PKR {bankOutflows.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: netBank >= 0 ? "#059669" : "#dc2626" }}>
                      Net Bank: {netBank >= 0 ? "+" : ""}PKR {netBank.toLocaleString()}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setActiveTab(7)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: "rgba(79, 70, 229, 0.3)",
                      color: "#4f46e5",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Bank Tab ({registerData?.bankTransactions?.length || 0})
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* ─── DAY RECONCILIATION ACTION BANNER ─── */}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: isClosed ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
              bgcolor: isClosed ? "rgba(16, 185, 129, 0.04)" : "rgba(245, 158, 11, 0.04)",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {isClosed ? (
                    <CheckCircleRoundedIcon sx={{ color: "#10b981", fontSize: 22 }} />
                  ) : (
                    <WarningAmberRoundedIcon sx={{ color: "#f59e0b", fontSize: 22 }} />
                  )}
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a" }}>
                    {isClosed
                      ? `Register Closed for ${selectedDate}`
                      : `Day-End Cash Audit Pending for ${selectedDate}`}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {isClosed
                    ? `Counted Cash: PKR ${actualCash.toLocaleString()} (Expected: PKR ${expectedCash.toLocaleString()}) • Closed at ${register.closedAt ? new Date(register.closedAt).toLocaleTimeString() : "Evening"}${register.notes ? ` • Note: ${register.notes}` : ""}`
                    : `Expected Drawer Balance tonight is PKR ${expectedCash.toLocaleString()}. Count the physical cash in the till/galla and close the register.`}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                {!isClosed ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircleRoundedIcon />}
                    onClick={() => {
                      setActualCashInput(String(expectedCash));
                      setCloseModalOpen(true);
                    }}
                    sx={{
                      bgcolor: "#4f46e5",
                      fontWeight: 800,
                      borderRadius: 2.5,
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      "&:hover": { bgcolor: "#4338ca" },
                    }}
                  >
                    Count Cash & Close Day
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<LockResetRoundedIcon />}
                    onClick={handleReopenRegister}
                    sx={{
                      color: "#dc2626",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                      fontWeight: 700,
                      borderRadius: 2.5,
                      textTransform: "none",
                      "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)", borderColor: "#dc2626" },
                    }}
                  >
                    Reopen Register
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* ─── ITEMIZED ACTIVITY TABS ─── */}
          <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "#f8fafc", px: 2 }}>
              <Tabs
                value={activeTab}
                onChange={(e, v) => setActiveTab(v)}
                sx={{
                  "& .MuiTab-root": {
                    fontWeight: 700,
                    textTransform: "none",
                    minHeight: 52,
                    fontSize: "0.88rem",
                  },
                }}
              >
                <Tab
                  icon={<PointOfSaleRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Tyre Sales Invoices (${registerData?.sales?.length || 0})`}
                />
                <Tab
                  icon={<ReceiptLongRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Shop Expenses (${registerData?.expenses?.length || 0})`}
                />
                <Tab
                  icon={<BadgeRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Staff Disbursements (${registerData?.staffPayouts?.length || 0})`}
                />
                <Tab
                  icon={<PublishedWithChangesRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Returns & Refunds (${registerData?.returns?.length || 0})`}
                />
                <Tab
                  icon={<LocalShippingRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Stock Purchases (${registerData?.purchases?.length || 0})`}
                />
                <Tab
                  icon={<PaymentsRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Khata Recoveries (${registerData?.customerRecoveries?.length || 0})`}
                />
                <Tab
                  icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Supplier Khata Paid (${registerData?.supplierPayments?.length || 0})`}
                />
                <Tab
                  icon={<AccountBalanceRoundedIcon fontSize="small" />}
                  iconPosition="start"
                  label={`Bank Operations (${registerData?.bankTransactions?.length || 0})`}
                />
              </Tabs>
            </Box>

            {/* TAB 0: SALES INVOICES */}
            {activeTab === 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Vehicle</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Tyres & Specifications</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total Bill (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Channel</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount Received</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Khata Due</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.sales?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No sales recorded on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.sales?.map((s, idx) => {
                        const items = Array.isArray(s.data) ? s.data : JSON.parse(s.data || "[]");
                        const tyreCount = items.reduce((acc, curr) => acc + (Number(curr.quantity || curr.qty || curr[3] || 0)), 0);
                        const timeStr = s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
                        const isBank = s.paymentMethod === "bank";

                        return (
                          <TableRow key={s.id || idx} hover>
                            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{timeStr}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                              {s.cname || "Walk-in Customer"}
                              {s.phone && (
                                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                                  {s.phone}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>
                              {s.vehicleNo ? `${s.vehicleNo} ${s.vehicleModel ? `(${s.vehicleModel})` : ""}` : "-"}
                            </TableCell>
                            <TableCell sx={{ minWidth: 150 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={`${tyreCount || items.length} tyres`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: "rgba(2, 132, 199, 0.08)", color: "#0284c7" }}
                                />
                                <Tooltip title="View Invoice & Tyres Breakdown">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedSale(s);
                                      setSaleModalOpen(true);
                                    }}
                                    sx={{
                                      color: "#0284c7",
                                      bgcolor: "rgba(2, 132, 199, 0.1)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      transition: "all 0.2s ease",
                                      "&:hover": {
                                        bgcolor: "#0284c7",
                                        color: "#ffffff",
                                        transform: "scale(1.08)",
                                      },
                                    }}
                                  >
                                    <VisibilityRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>PKR {Number(s.totalBill || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              {isBank ? (
                                <Chip
                                  icon={<AccountBalanceRoundedIcon style={{ fontSize: 15, color: "#4f46e5" }} />}
                                  label={s.bankName ? `Bank: ${s.bankName}` : "Bank Transfer"}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: "rgba(79, 70, 229, 0.08)",
                                    color: "#4f46e5",
                                    border: "1px solid rgba(79, 70, 229, 0.25)",
                                  }}
                                />
                              ) : (
                                <Chip
                                  icon={<SavingsRoundedIcon style={{ fontSize: 15, color: "#059669" }} />}
                                  label="Cash Drawer"
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: "rgba(16, 185, 129, 0.08)",
                                    color: "#059669",
                                    border: "1px solid rgba(16, 185, 129, 0.25)",
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "#10b981" }}>
                              PKR {Number(s.receivedAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: Number(s.remainingAmount || 0) > 0 ? "#ef4444" : "text.secondary" }}>
                              PKR {Number(s.remainingAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {Number(s.remainingAmount || 0) > 0 ? (
                                <Chip
                                  label={Number(s.receivedAmount || 0) > 0 ? "Partial Credit" : "Full Khata"}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              ) : isBank ? (
                                <Chip
                                  label="Paid (Bank)"
                                  size="small"
                                  sx={{ fontWeight: 700, bgcolor: "rgba(79, 70, 229, 0.12)", color: "#4f46e5" }}
                                />
                              ) : (
                                <Chip
                                  label="Paid (Cash)"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700 }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 1: SHOP EXPENSES */}
            {activeTab === 1 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Expense Title</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.expenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No shop expenses recorded on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.expenses?.map((e, idx) => (
                        <TableRow key={e.id || idx} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Chip label={e.category} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{e.title}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#dc2626" }}>
                            PKR {Number(e.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>{e.paymentMode || "Cash"}</TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{e.remarks || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 2: STAFF DISBURSEMENTS */}
            {activeTab === 2 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Disbursement Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>For Month</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount Paid (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.staffPayouts?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No staff salary or advance payouts disbursed on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.staffPayouts?.map((p, idx) => (
                        <TableRow key={p.id || idx} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{p.staffName}</TableCell>
                          <TableCell>
                            <Chip
                              label={p.payoutType}
                              size="small"
                              color={p.payoutType === "Advance" ? "warning" : "primary"}
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>{p.month || "-"}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#dc2626" }}>
                            PKR {Number(p.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{p.note || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 3: RETURNS & REFUNDS */}
            {activeTab === 3 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Return #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Returned Tyre(s)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Replacement Tyre(s)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cash Settled (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.returns?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No tyre returns or exchanges processed on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.returns?.map((r, idx) => {
                        const rets = Array.isArray(r.returnedItems) ? r.returnedItems : JSON.parse(r.returnedItems || "[]");
                        const reps = Array.isArray(r.replacementItems) ? r.replacementItems : JSON.parse(r.replacementItems || "[]");

                        return (
                          <TableRow key={r.id || idx} hover>
                            <TableCell sx={{ fontWeight: 700, color: "#4f46e5" }}>{r.returnNo}</TableCell>
                            <TableCell>
                              <Chip
                                label={r.type === "exchange" ? "Exchange (Tabdili)" : "Return (Wapsi)"}
                                size="small"
                                color={r.type === "exchange" ? "info" : "error"}
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{r.customerName}</TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>
                              {rets.map((item, i) => (
                                <div key={i}>{`${item.quantity || 1}x ${item.brand || ""} ${item.size || ""}`}</div>
                              ))}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>
                              {reps.length > 0 ? (
                                reps.map((item, i) => (
                                  <div key={i}>{`${item.quantity || 1}x ${item.brand || ""} ${item.size || ""}`}</div>
                                ))
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>
                              PKR {Number(r.settledAmount || Math.abs(r.netDifference) || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip label={r.settlementMode?.replace("_", " ")} size="small" variant="outlined" />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 4: STOCK PURCHASES */}
            {activeTab === 4 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Tyres Bought</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total Bill (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Paid Out (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Khata Due (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.purchases?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No stock purchases recorded on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.purchases?.map((p, idx) => {
                        const items = Array.isArray(p.items) ? p.items : JSON.parse(p.items || "[]");
                        const tyreCount = items.reduce((acc, curr) => acc + (Number(curr.quantity || curr.qty || 1)), 0);

                        return (
                          <TableRow key={p.id || idx} hover>
                            <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#4f46e5" }}>{p.invoiceNo}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                              {p.supplierName}
                              {p.supplierType && (
                                <Chip
                                  label={p.supplierType}
                                  size="small"
                                  sx={{ ml: 1, textTransform: "capitalize", fontSize: "0.7rem", height: 20 }}
                                />
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.85rem", color: "text.secondary" }}>{p.contact || "-"}</TableCell>
                            <TableCell>
                              <Tooltip
                                title={items.map((it, i) => `${it.brand || ""} ${it.size || ""} (${it.quantity || 1}x)`).join(", ")}
                              >
                                <Chip
                                  label={`${tyreCount || items.length} tyres`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: "rgba(79, 70, 229, 0.08)", color: "#4f46e5", cursor: "pointer" }}
                                />
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>PKR {Number(p.totalAmount || 0).toLocaleString()}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "#dc2626" }}>
                              PKR {Number(p.paid || 0).toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: Number(p.remaining || 0) > 0 ? "#f59e0b" : "text.secondary" }}>
                              PKR {Number(p.remaining || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={p.status || "Received"}
                                size="small"
                                color={p.status === "Received" ? "success" : "info"}
                                variant="outlined"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 5: CUSTOMER KHATA RECOVERIES */}
            {activeTab === 5 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cash Recovered (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Note / Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.customerRecoveries?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No customer Khata recoveries received on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.customerRecoveries?.map((rec, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{rec.time}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{rec.customerName}</TableCell>
                          <TableCell>
                            <Chip label={rec.type} size="small" color="success" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#10b981" }}>
                            + PKR {Number(rec.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{rec.note || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 6: SUPPLIER KHATA PAYMENTS */}
            {activeTab === 6 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Supplier Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Cash Paid Out (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Note / Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.supplierPayments?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No supplier Khata debt payments disbursed on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.supplierPayments?.map((pay, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{pay.time}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{pay.supplierName}</TableCell>
                          <TableCell>
                            <Chip label={pay.supplierType} size="small" sx={{ textTransform: "capitalize", fontWeight: 700 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#dc2626" }}>
                            - PKR {Number(pay.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{pay.note || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* TAB 7: BANK OPERATIONS & FUNDS TRANSFERS */}
            {activeTab === 7 && (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bank Account</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Balance After (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.bankTransactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                          No bank deposits or disbursements recorded on {selectedDate}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      registerData?.bankTransactions?.map((tx, idx) => (
                        <TableRow key={tx.id || idx} hover>
                          <TableCell sx={{ color: "text.secondary", fontWeight: 600 }}>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                            {tx.bankAccount?.bankName} ({tx.bankAccount?.accountNumber})
                          </TableCell>
                          <TableCell>{tx.category}</TableCell>
                          <TableCell>
                            <Chip
                              label={tx.type === "deposit" ? "Inflow (Deposit)" : "Outflow (Withdrawal)"}
                              size="small"
                              color={tx.type === "deposit" ? "success" : "error"}
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                            {tx.reference || "-"}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                            {tx.description || "-"}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 800,
                              color: tx.type === "deposit" ? "#10b981" : "#dc2626",
                            }}
                          >
                            {tx.type === "deposit" ? "+ " : "- "}PKR {Number(tx.amount || 0).toLocaleString()}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#4f46e5" }}>
                            PKR {Number(tx.balanceAfter || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </>
      )}

      {/* ─── MODAL 1: SET MORNING OPENING FLOAT ─── */}
      <Dialog open={openModalOpen} onClose={() => setOpenModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Set Morning Opening Balance</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the amount of cash currently in the register/drawer at the start of the day ({selectedDate}).
          </Typography>
          <TextField
            fullWidth
            required
            autoFocus
            label="Opening Cash (PKR)"
            type="number"
            value={openingInput}
            onChange={(e) => setOpeningInput(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notes (Optional)"
            placeholder="e.g. Petty cash from safe, change float"
            value={openingNotes}
            onChange={(e) => setOpeningNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveOpening} sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#4f46e5" }}>
            Save Opening Cash
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MODAL 2: CLOSE DAY REGISTER / CASH AUDIT ─── */}
      <Dialog open={closeModalOpen} onClose={() => setCloseModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Day-End Cash Audit & Close Register</span>
            <IconButton onClick={() => setCloseModalOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
            Expected Closing Cash in Till: <strong>PKR {expectedCash.toLocaleString()}</strong>
          </Alert>

          <TextField
            fullWidth
            required
            autoFocus
            label="Physical Cash Counted in Drawer (PKR)"
            type="number"
            value={actualCashInput}
            onChange={(e) => setActualCashInput(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* Real-time Discrepancy indicator */}
          {(() => {
            const counted = Number(actualCashInput || 0);
            const discrepancy = Math.round((counted - expectedCash) * 100) / 100;
            if (discrepancy === 0) {
              return (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  ✓ Perfect Match! Physical cash exactly equals expected cash.
                </Alert>
              );
            } else if (discrepancy > 0) {
              return (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  Cash Excess of <strong>+ PKR {discrepancy.toLocaleString()}</strong> (More money in drawer than calculated).
                </Alert>
              );
            } else {
              return (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  Cash Shortage of <strong>- PKR {Math.abs(discrepancy).toLocaleString()}</strong> (Money missing from calculated drawer cash).
                </Alert>
              );
            }
          })()}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Audited / Closed By"
                value={closedByInput}
                onChange={(e) => setClosedByInput(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Closing Remarks"
                placeholder="e.g. All cash verified, deposited to safe"
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setCloseModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCloseRegister} sx={{ textTransform: "none", fontWeight: 800, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}>
            Confirm & Lock Closing Register
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── MODAL 3: PRINTABLE ROOZNAMCHA SHEET ─── */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Daily Rooznamcha Print Preview
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={handlePrint} sx={{ fontWeight: 700 }}>
              Print Now
            </Button>
            <IconButton onClick={() => setPrintModalOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box id="printable-rooznamcha" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                Usama Saeed Tyre Shop
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                DAILY CASH REGISTER & ROOZNAMCHA CLOSING SHEET
              </Typography>
              <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                Date: <strong>{selectedDate}</strong> • Generated: {new Date().toLocaleString()}
              </Typography>
            </Box>

            {/* Financial Summary Grid */}
            <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#ccc" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666", fontSize: "0.68rem" }}>
                    1. MORNING OPENING FLOAT
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    PKR {opening.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#777", display: "block", fontSize: "0.65rem" }}>
                    Cash in till at morning start
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#ccc" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#059669", fontSize: "0.68rem" }}>
                    2. CASH DRAWER INFLOWS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#059669" }}>
                    + PKR {inflows.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#777", display: "block", fontSize: "0.65rem" }}>
                    Sales: {totalCashSales.toLocaleString()} | Khata: {Number(summary.totalCustomerKhataRecoveries || 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#ccc" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#dc2626", fontSize: "0.68rem" }}>
                    3. CASH DRAWER OUTFLOWS
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#dc2626" }}>
                    - PKR {outflows.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#777", display: "block", fontSize: "0.65rem" }}>
                    Stock: {Number(summary.totalPurchasePaid || 0).toLocaleString()} | Bills: {Number(summary.totalExpenses || 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#000", bgcolor: "#f8fafc" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#000", fontSize: "0.68rem" }}>
                    4. FINAL CLOSING DRAWER CASH
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#000" }}>
                    PKR {(isClosed ? actualCash : expectedCash).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#555", display: "block", fontSize: "0.65rem" }}>
                    {isClosed ? "Physical Till Counted" : "Expected in Cash Galla"}
                  </Typography>
                </Paper>
              </Grid>

              {/* Second Row: Bank Transfers & Total Daily Revenue */}
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#818cf8", bgcolor: "rgba(79, 70, 229, 0.02)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#4f46e5", fontSize: "0.68rem" }}>
                    5. BANK INFLOWS (SALES & KHATA)
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#4338ca" }}>
                    + PKR {bankInflows.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666", display: "block", fontSize: "0.65rem" }}>
                    Bank Sales: {bankSales.toLocaleString()} | Khata: {bankKhataRec.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#f87171", bgcolor: "rgba(239, 68, 68, 0.02)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#dc2626", fontSize: "0.68rem" }}>
                    6. BANK OUTFLOWS DISBURSED
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#b91c1c" }}>
                    - PKR {bankOutflows.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#666", display: "block", fontSize: "0.65rem" }}>
                    Stock: {Number(summary.totalBankPurchasePaid || 0).toLocaleString()} | Bills: {Number(summary.totalBankExpenses || 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.2, borderColor: "#0284c7", bgcolor: "rgba(2, 132, 199, 0.04)" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#0369a1", fontSize: "0.68rem" }}>
                    7. TOTAL DAILY REVENUE (CASH + BANK)
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#0284c7" }}>
                    PKR {totalSalesRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#555", display: "block", fontSize: "0.65rem" }}>
                    Total Billed: PKR {(summary.totalSalesBill || 0).toLocaleString()} ({registerData?.sales?.length || 0} Invoices)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Section 1: Tyre Sales Invoices Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1.5px solid #000", pb: 0.5 }}>
              Tyre Sales Invoices for {selectedDate} ({registerData?.sales?.length || 0} Invoices):
            </Typography>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Vehicle / Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Tyres & Specs</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Total Bill (PKR)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Payment Channel</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Amount Received</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Khata Due</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registerData?.sales?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No sales recorded on {selectedDate}.</TableCell>
                  </TableRow>
                ) : (
                  registerData?.sales?.map((s, idx) => {
                    const items = Array.isArray(s.data) ? s.data : JSON.parse(s.data || "[]");
                    const tyreCount = items.reduce((acc, curr) => acc + (Number(curr.quantity || curr.qty || curr[3] || 0)), 0);
                    const timeStr = s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "-";
                    const isBank = s.paymentMethod === "bank";

                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: "#666", fontSize: "0.75rem" }}>{idx + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>{timeStr}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{s.cname || "Walk-in Customer"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{s.vehicleNo || s.phone || "-"}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{tyreCount || items.length} tyres</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>
                          PKR {Number(s.totalBill || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: isBank ? "#4f46e5" : "#059669" }}>
                          {isBank ? `Bank: ${s.bankName || "Transfer"}` : "Cash Drawer"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#059669", fontSize: "0.75rem" }}>
                          PKR {Number(s.receivedAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: Number(s.remainingAmount || 0) > 0 ? "#dc2626" : "#666", fontSize: "0.75rem" }}>
                          PKR {Number(s.remainingAmount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {registerData?.sales?.length > 0 && (
                  <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                    <TableCell colSpan={5} sx={{ fontWeight: 800, fontSize: "0.75rem", textAlign: "right" }}>
                      Sales Totals:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.75rem" }}>
                      PKR {Number(summary.totalSalesBill || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#333" }}>
                      Drawer: {totalCashSales.toLocaleString()} | Bank: {bankSales.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.75rem" }}>
                      PKR {(totalCashSales + bankSales).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: Number(summary.totalCreditRemaining || 0) > 0 ? "#dc2626" : "#666", fontSize: "0.75rem" }}>
                      PKR {Number(summary.totalCreditRemaining || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Section 2: Expenses breakdown */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
              Shop Expenses Breakdown for {selectedDate}:
            </Typography>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Amount (PKR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registerData?.expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No expenses recorded today</TableCell>
                  </TableRow>
                ) : (
                  registerData?.expenses?.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{e.category}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem" }}>{e.title}</TableCell>
                      <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: e.paymentMode !== "Cash" ? "#4f46e5" : "#059669" }}>
                        {e.paymentMode !== "Cash" ? `Bank: ${e.bankName || e.paymentMode}` : "Cash Drawer"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>PKR {Number(e.amount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Staff payouts breakdown */}
            {registerData?.staffPayouts?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Staff Salary / Advances Disbursed:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Staff Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Disbursement Source</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Amount (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.staffPayouts?.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{p.staffName}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem" }}>{p.payoutType}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: p.paymentMethod === "bank" ? "#4f46e5" : "#059669" }}>
                          {p.paymentMethod === "bank" ? `Bank: ${p.bankName || "Transfer"}` : "Cash Drawer"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.75rem" }}>PKR {Number(p.amount || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Stock Purchases (Stock-In) breakdown */}
            {registerData?.purchases?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Stock Purchases (Stock-In Payments) for {selectedDate}:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Invoice #</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Supplier Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Tyres Bought</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Bill Total (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>Payment Source</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }} align="right">Amount Paid (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.purchases?.map((p, i) => {
                      const items = Array.isArray(p.items) ? p.items : JSON.parse(p.items || "[]");
                      const tyreCount = items.reduce((acc, curr) => acc + (Number(curr.quantity || curr.qty || 1)), 0);
                      const isBank = p.paymentMethod === "bank" || Boolean(p.bankAccountId);
                      return (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem" }}>{p.invoiceNo}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>{p.supplierName}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem" }}>{tyreCount || items.length} tyres</TableCell>
                          <TableCell align="right" sx={{ fontSize: "0.75rem" }}>PKR {Number(p.totalAmount || 0).toLocaleString()}</TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: isBank ? "#4f46e5" : "#059669" }}>
                            {isBank ? `Bank: ${p.bankName || "Transfer"}` : "Cash Drawer"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626", fontSize: "0.75rem" }}>
                            PKR {Number(p.paid || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Customer Returns breakdown */}
            {registerData?.returns?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Customer Returns & Exchanges for {selectedDate}:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Return #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Cash Settled (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.returns?.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 700 }}>{r.returnNo}</TableCell>
                        <TableCell>{r.type === "exchange" ? "Exchange" : "Return"}</TableCell>
                        <TableCell>{r.customerName}</TableCell>
                        <TableCell>{r.settlementMode?.replace("_", " ")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PKR {Number(r.settledAmount || Math.abs(r.netDifference) || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Customer Khata Recoveries breakdown */}
            {registerData?.customerRecoveries?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Customer Khata (Credit) Debt Recoveries Collected for {selectedDate}:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount Recovered (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.customerRecoveries?.map((rec, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: "#666" }}>{i + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{rec.time}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{rec.customerName}</TableCell>
                        <TableCell>{rec.type}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#059669" }}>
                          + PKR {Number(rec.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "#555" }}>{rec.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Supplier Khata Payments breakdown */}
            {registerData?.supplierPayments?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Supplier / Vendor Khata Debt Payments Disbursed for {selectedDate}:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Supplier Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Vendor Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount Paid Out (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.supplierPayments?.map((pay, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: "#666" }}>{i + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{pay.time}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{pay.supplierName}</TableCell>
                        <TableCell sx={{ textTransform: "capitalize" }}>{pay.supplierType}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>
                          - PKR {Number(pay.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "#555" }}>{pay.note || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Bank Accounts Activity breakdown */}
            {registerData?.bankTransactions?.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                  Bank Accounts Inflows & Disbursements for {selectedDate}:
                </Typography>
                <Table size="small" sx={{ mb: 3 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Bank Account</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Balance After</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registerData?.bankTransactions?.map((tx, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: "#666" }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {tx.bankAccount?.bankName} ({tx.bankAccount?.accountNumber})
                        </TableCell>
                        <TableCell>{tx.category}</TableCell>
                        <TableCell>{tx.type === "deposit" ? "Deposit (+)" : "Withdrawal (-)"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{tx.reference || "-"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: tx.type === "deposit" ? "#059669" : "#dc2626" }}>
                          {tx.type === "deposit" ? "+ " : "- "}PKR {Number(tx.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          PKR {Number(tx.balanceAfter || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Signature Area */}
            <Box sx={{ mt: 6, pt: 3, borderTop: "1px dashed #999" }}>
              <Grid container spacing={4}>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Cashier / Counter In-Charge
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Proprietor / Shop Manager
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL 4: SALE INVOICE & TYRES BREAKDOWN DIALOG ─── */}
      <Dialog
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PointOfSaleRoundedIcon sx={{ color: "#4f46e5" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Sales Invoice #{selectedSale?.id} Breakdown
            </Typography>
          </Stack>
          <IconButton onClick={() => setSaleModalOpen(false)} size="small">
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2">
              Customer: <strong>{selectedSale?.cname || "Walk-in Customer"}</strong> {selectedSale?.phone ? `(${selectedSale.phone})` : ""}
            </Typography>
            {selectedSale?.vehicleNo && (
              <Typography variant="body2">
                Vehicle: <strong>{selectedSale.vehicleNo}</strong> {selectedSale.vehicleModel ? `(${selectedSale.vehicleModel})` : ""}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Date & Time: {selectedSale?.createdAt ? new Date(selectedSale.createdAt).toLocaleString() : "-"}
            </Typography>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f8fafc" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Tyre Model & Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const items = Array.isArray(selectedSale?.data) ? selectedSale.data : JSON.parse(selectedSale?.data || "[]");
                  return items.map((it, idx) => {
                    const name = it.itemName || it.name || it[0] || "Tyre";
                    const size = it.size || it[1] || "";
                    const price = Number(it.price || it[2] || 0);
                    const qty = Number(it.quantity || it.qty || it[3] || 1);
                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 700 }}>{name} {size}</TableCell>
                        <TableCell>{qty}</TableCell>
                        <TableCell>PKR {price.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#4f46e5" }}>
                          PKR {(qty * price).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
          </TableContainer>

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: "#f8fafc" }}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Total Bill:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800 }}>PKR {Number(selectedSale?.totalBill || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Amount Received:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: "#10b981" }}>PKR {Number(selectedSale?.receivedAmount || 0).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Payment Channel:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: selectedSale?.paymentMethod === "bank" ? "#4f46e5" : "#059669" }}>
                  {selectedSale?.paymentMethod === "bank" ? `Bank: ${selectedSale.bankName || "Transfer"}` : "Cash Drawer"}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Remaining Due:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: Number(selectedSale?.remainingAmount || 0) > 0 ? "#ef4444" : "text.secondary" }}>
                  PKR {Number(selectedSale?.remainingAmount || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status:</Typography>
                <Chip
                  label={
                    Number(selectedSale?.remainingAmount || 0) > 0
                      ? (Number(selectedSale?.receivedAmount || 0) > 0 ? "Partial Due" : "Full Khata")
                      : (selectedSale?.paymentMethod === "bank" ? "Paid (Bank Transfer)" : "Paid (Cash)")
                  }
                  size="small"
                  color={Number(selectedSale?.remainingAmount || 0) > 0 ? "warning" : "success"}
                  sx={{ fontWeight: 700, mt: 0.5 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
