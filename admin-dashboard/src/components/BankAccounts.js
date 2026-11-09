import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  MenuItem,
  InputAdornment,
  Autocomplete,
} from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import * as bankApi from "../api/BankAccountApi";

// List of common Pakistani Banks for auto-suggest
const PAK_BANKS = [
  "Meezan Bank",
  "Habib Bank Limited (HBL)",
  "MCB Bank",
  "United Bank Limited (UBL)",
  "Allied Bank Limited (ABL)",
  "Bank Alfalah",
  "Faysal Bank",
  "Askari Bank",
  "Bank of Punjab (BOP)",
  "Standard Chartered Bank",
  "JS Bank",
  "Soneri Bank",
  "Bank Al-Habib",
  "Dubai Islamic Bank",
];

export default function BankAccounts() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [totalFunds, setTotalFunds] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [transactions, setTransactions] = useState([]);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Search & Filter for All Transactions Table
  const [txSearch, setTxSearch] = useState("");
  const [txFilterAccount, setTxFilterAccount] = useState("all");
  const [txFilterType, setTxFilterType] = useState("all");

  // ─── MODAL STATES ───
  // 1. Add / Edit Account
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accForm, setAccForm] = useState({
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    iban: "",
    branch: "",
    openingBalance: "0",
    status: "Active",
    notes: "",
  });

  // 2. Manual Deposit / Withdrawal
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({
    bankAccountId: "",
    type: "deposit", // "deposit" | "withdrawal"
    amount: "",
    category: "Direct Cash Deposit",
    reference: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // 3. Inter-Bank Transfer
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    reference: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // 4. Statement & History Modal (Printable)
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementLoading, setStatementLoading] = useState(false);
  const [statementData, setStatementData] = useState(null);

  // Fetch all accounts and transactions
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const [accRes, txRes] = await Promise.all([
        bankApi.getBankAccounts(),
        bankApi.getBankTransactions(),
      ]);

      setAccounts(accRes.data?.accounts || []);
      setTotalFunds(Number(accRes.data?.totalFunds || 0));
      setActiveCount(Number(accRes.data?.activeCount || 0));
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (err) {
      console.error("Failed to load bank data:", err);
      setErrorMsg(err.response?.data?.error || err.message || "Failed to load bank data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Copy to clipboard helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── 1. CREATE / EDIT ACCOUNT HANDLERS ───
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setAccForm({
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",
      branch: "",
      openingBalance: "0",
      status: "Active",
      notes: "",
    });
    setAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccForm({
      bankName: acc.bankName || "",
      accountTitle: acc.accountTitle || "",
      accountNumber: acc.accountNumber || "",
      iban: acc.iban || "",
      branch: acc.branch || "",
      openingBalance: String(acc.openingBalance || 0),
      status: acc.status || "Active",
      notes: acc.notes || "",
    });
    setAccountModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accForm.bankName || !accForm.accountTitle || !accForm.accountNumber) {
      setErrorMsg("Bank Name, Account Title, and Account Number are required.");
      return;
    }

    try {
      if (editingAccount) {
        await bankApi.updateBankAccount(editingAccount.id, accForm);
        setSuccessMsg(`Bank account "${accForm.bankName}" updated successfully.`);
      } else {
        await bankApi.createBankAccount(accForm);
        setSuccessMsg(`Bank account "${accForm.bankName}" added with initial balance PKR ${Number(accForm.openingBalance || 0).toLocaleString()}.`);
      }
      setAccountModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteAccount = async (acc) => {
    if (
      !window.confirm(
        `Are you sure you want to delete bank account "${acc.bankName} (${acc.accountNumber})"? All associated transaction histories will also be removed.`
      )
    ) {
      return;
    }
    try {
      await bankApi.deleteBankAccount(acc.id);
      setSuccessMsg(`Bank account "${acc.bankName}" deleted.`);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // ─── 2. MANUAL DEPOSIT / WITHDRAWAL HANDLERS ───
  const handleOpenDepositModal = (acc = null, defaultType = "deposit") => {
    setDepositForm({
      bankAccountId: acc ? acc.id : accounts[0]?.id || "",
      type: defaultType,
      amount: "",
      category: defaultType === "deposit" ? "Direct Cash Deposit" : "Direct Cash Withdrawal",
      reference: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setDepositModalOpen(true);
  };

  const handleSaveDepositWithdraw = async (e) => {
    e.preventDefault();
    const num = Number(depositForm.amount);
    if (!depositForm.bankAccountId || !num || num <= 0) {
      setErrorMsg("Please select a valid bank account and enter an amount greater than 0.");
      return;
    }

    try {
      await bankApi.depositWithdrawManual(depositForm);
      setSuccessMsg(
        `Successfully recorded ${depositForm.type} of PKR ${num.toLocaleString()}.`
      );
      setDepositModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // ─── 3. INTER-BANK TRANSFER HANDLERS ───
  const handleOpenTransferModal = (fromAcc = null) => {
    const fromId = fromAcc ? fromAcc.id : accounts[0]?.id || "";
    const toId = accounts.find((a) => a.id !== fromId)?.id || "";
    setTransferForm({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: "",
      reference: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setTransferModalOpen(true);
  };

  const handleSaveTransfer = async (e) => {
    e.preventDefault();
    const num = Number(transferForm.amount);
    if (!transferForm.fromAccountId || !transferForm.toAccountId || !num || num <= 0) {
      setErrorMsg("Please choose both source and destination accounts and a valid transfer amount.");
      return;
    }
    if (String(transferForm.fromAccountId) === String(transferForm.toAccountId)) {
      setErrorMsg("Source and destination accounts must be different.");
      return;
    }

    try {
      const res = await bankApi.transferBetweenBanks(transferForm);
      setSuccessMsg(res.data?.message || "Transfer completed successfully.");
      setTransferModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message);
    }
  };

  // ─── 4. STATEMENT & HISTORY MODAL HANDLERS ───
  const handleOpenStatement = async (acc) => {
    setStatementModalOpen(true);
    setStatementLoading(true);
    try {
      const res = await bankApi.getBankAccountById(acc.id);
      setStatementData(res.data);
    } catch (err) {
      console.error("Error loading account statement:", err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handlePrintStatement = () => {
    window.print();
  };

  // Filtered transactions for the audit table
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (txFilterAccount !== "all" && String(tx.bankAccountId) !== String(txFilterAccount)) {
        return false;
      }
      if (txFilterType !== "all" && tx.type !== txFilterType) {
        return false;
      }
      if (txSearch.trim()) {
        const q = txSearch.toLowerCase().trim();
        const ref = (tx.reference || "").toLowerCase();
        const desc = (tx.description || "").toLowerCase();
        const cat = (tx.category || "").toLowerCase();
        const bName = (tx.bankAccount?.bankName || "").toLowerCase();
        if (!ref.includes(q) && !desc.includes(q) && !cat.includes(q) && !bName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, txFilterAccount, txFilterType, txSearch]);

  // Aggregate deposits and withdrawals for statistics
  const { totalDepositsThisMonth, totalWithdrawalsThisMonth } = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    let deps = 0;
    let withs = 0;
    transactions.forEach((tx) => {
      if ((tx.date || "").slice(0, 7) === currentMonthPrefix) {
        const amt = Number(tx.amount || 0);
        if (tx.type === "deposit") deps += amt;
        else if (tx.type === "withdrawal") withs += amt;
      }
    });
    return { totalDepositsThisMonth: deps, totalWithdrawalsThisMonth: withs };
  }, [transactions]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* ─── HEADER BAR ─── */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          mb: 3,
          boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.3)",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  bgcolor: "rgba(99, 102, 241, 0.2)",
                  p: 1.5,
                  borderRadius: 2.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccountBalanceRoundedIcon sx={{ fontSize: 32, color: "#818cf8" }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Bank Accounts & Funds Management
                </Typography>
                <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.3 }}>
                  Shop Bank Accounts (بینک کھاتہ جات), Liquid Funds, and Automated Khata Reconciliations
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
            >
              <Button
                variant="outlined"
                startIcon={<SwapHorizRoundedIcon />}
                onClick={() => handleOpenTransferModal()}
                disabled={accounts.length < 2}
                sx={{
                  color: "#cbd5e1",
                  borderColor: "rgba(255,255,255,0.2)",
                  fontWeight: 700,
                  borderRadius: 2.5,
                  textTransform: "none",
                  "&:hover": { borderColor: "#ffffff", bgcolor: "rgba(255,255,255,0.05)" },
                }}
              >
                Inter-Bank Transfer
              </Button>
              <Button
                variant="outlined"
                startIcon={<ArrowDownwardRoundedIcon />}
                onClick={() => handleOpenDepositModal(null, "deposit")}
                disabled={accounts.length === 0}
                sx={{
                  color: "#34d399",
                  borderColor: "rgba(52, 211, 153, 0.4)",
                  fontWeight: 700,
                  borderRadius: 2.5,
                  textTransform: "none",
                  "&:hover": { borderColor: "#34d399", bgcolor: "rgba(52, 211, 153, 0.1)" },
                }}
              >
                Deposit / Withdraw
              </Button>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={handleOpenAddAccount}
                sx={{
                  bgcolor: "#4f46e5",
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: "none",
                  px: 2.5,
                  "&:hover": { bgcolor: "#4338ca" },
                }}
              >
                Add Bank Account
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* ─── ALERTS ─── */}
      {successMsg && (
        <Alert
          severity="success"
          onClose={() => setSuccessMsg("")}
          sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 600 }}
        >
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg("")}
          sx={{ mb: 2.5, borderRadius: 2.5, fontWeight: 600 }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* ─── KPI SUMMARY CARDS ─── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* 1. Total Liquid Bank Funds */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "rgba(79, 70, 229, 0.2)",
              background: "linear-gradient(135deg, rgba(79, 70, 229, 0.06) 0%, rgba(99, 102, 241, 0.01) 100%)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#4f46e5", letterSpacing: "0.05em" }}>
                TOTAL LIQUID BANK FUNDS
              </Typography>
              <AccountBalanceRoundedIcon sx={{ color: "#4f46e5", fontSize: 20 }} />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a" }}>
              PKR {totalFunds.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              Across {accounts.length} registered bank accounts
            </Typography>
          </Paper>
        </Grid>

        {/* 2. Active Accounts */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "rgba(16, 185, 129, 0.2)",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.01) 100%)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#059669", letterSpacing: "0.05em" }}>
                ACTIVE SHOP ACCOUNTS
              </Typography>
              <CheckCircleRoundedIcon sx={{ color: "#10b981", fontSize: 20 }} />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#059669" }}>
              {activeCount} Active
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              {accounts.length - activeCount} suspended or archived
            </Typography>
          </Paper>
        </Grid>

        {/* 3. Monthly Inflows */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "rgba(14, 165, 233, 0.2)",
              background: "linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(2, 132, 199, 0.01) 100%)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#0284c7", letterSpacing: "0.05em" }}>
                DEPOSITS THIS MONTH
              </Typography>
              <ArrowDownwardRoundedIcon sx={{ color: "#0284c7", fontSize: 20 }} />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#0284c7" }}>
              + PKR {totalDepositsThisMonth.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              Sales, recoveries, and cash deposits
            </Typography>
          </Paper>
        </Grid>

        {/* 4. Monthly Outflows */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "rgba(239, 68, 68, 0.2)",
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(220, 38, 38, 0.01) 100%)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#dc2626", letterSpacing: "0.05em" }}>
                OUTFLOWS THIS MONTH
              </Typography>
              <ArrowUpwardRoundedIcon sx={{ color: "#dc2626", fontSize: 20 }} />
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#dc2626" }}>
              - PKR {totalWithdrawalsThisMonth.toLocaleString()}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
              Supplier payments, salaries, bills
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── BANK ACCOUNTS CARDS GRID ─── */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#1e293b" }}>
            Shop Bank Accounts ({accounts.length})
          </Typography>
          <Button
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={loadData}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Refresh
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <CircularProgress size={36} sx={{ color: "#4f46e5" }} />
          </Box>
        ) : accounts.length === 0 ? (
          <Card
            elevation={0}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "#ffffff",
            }}
          >
            <AccountBalanceRoundedIcon sx={{ fontSize: 48, color: "#94a3b8", mb: 1.5 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              No Bank Accounts Added Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Add your shop's Meezan, HBL, MCB, or Allied bank accounts to track incoming customer payments and outgoing supplier invoices.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenAddAccount}
              sx={{ bgcolor: "#4f46e5", fontWeight: 700, borderRadius: 2 }}
            >
              Add First Bank Account
            </Button>
          </Card>
        ) : (
          <Grid container spacing={2.5}>
            {accounts.map((acc) => {
              const bal = Number(acc.currentBalance || 0);
              const isNegative = bal < 0;

              return (
                <Grid item xs={12} sm={6} lg={4} key={acc.id}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "#ffffff",
                      p: 2.5,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        boxShadow: "0 10px 20px -5px rgba(0,0,0,0.08)",
                        borderColor: "#818cf8",
                      },
                    }}
                  >
                    <Box>
                      {/* Top Row: Bank Name & Status Chip */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.2 }}>
                            {acc.bankName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            {acc.branch ? `Branch: ${acc.branch}` : "Main Branch"}
                          </Typography>
                        </Box>
                        <Chip
                          label={acc.status || "Active"}
                          size="small"
                          color={acc.status === "Active" ? "success" : "default"}
                          sx={{ fontWeight: 800, fontSize: "0.72rem" }}
                        />
                      </Stack>

                      {/* Account Title */}
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#334155", mb: 1 }}>
                        {acc.accountTitle}
                      </Typography>

                      {/* Account Number with 1-Click Copy */}
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          bgcolor: "#f8fafc",
                          borderRadius: 2,
                          mb: 1.5,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Account Number:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                            {acc.accountNumber}
                          </Typography>
                        </Box>
                        <Tooltip title={copiedId === `num-${acc.id}` ? "Copied!" : "Copy Account #"}>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(acc.accountNumber, `num-${acc.id}`)}
                          >
                            <ContentCopyRoundedIcon fontSize="small" sx={{ color: copiedId === `num-${acc.id}` ? "#10b981" : "inherit" }} />
                          </IconButton>
                        </Tooltip>
                      </Paper>

                      {/* IBAN (if available) */}
                      {acc.iban && (
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 1,
                            bgcolor: "#f8fafc",
                            borderRadius: 2,
                            mb: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                              IBAN:
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, fontFamily: "monospace" }}>
                              {acc.iban}
                            </Typography>
                          </Box>
                          <Tooltip title={copiedId === `iban-${acc.id}` ? "Copied!" : "Copy IBAN"}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(acc.iban, `iban-${acc.id}`)}
                            >
                              <ContentCopyRoundedIcon fontSize="small" sx={{ color: copiedId === `iban-${acc.id}` ? "#10b981" : "inherit" }} />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      )}

                      {/* Current Balance */}
                      <Box sx={{ my: 1.5, p: 1.5, bgcolor: isNegative ? "rgba(239,68,68,0.06)" : "rgba(79,70,229,0.04)", borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                          AVAILABLE BALANCE
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 900,
                            color: isNegative ? "#dc2626" : "#4f46e5",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          PKR {bal.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Card Actions */}
                    <Box sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={<ArrowDownwardRoundedIcon fontSize="small" />}
                          onClick={() => handleOpenDepositModal(acc, "deposit")}
                          sx={{
                            color: "#059669",
                            borderColor: "rgba(5, 150, 105, 0.4)",
                            fontWeight: 700,
                            textTransform: "none",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "rgba(5, 150, 105, 0.08)" },
                          }}
                        >
                          Deposit
                        </Button>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={<ArrowUpwardRoundedIcon fontSize="small" />}
                          onClick={() => handleOpenDepositModal(acc, "withdrawal")}
                          sx={{
                            color: "#dc2626",
                            borderColor: "rgba(220, 38, 38, 0.4)",
                            fontWeight: 700,
                            textTransform: "none",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "rgba(220, 38, 38, 0.08)" },
                          }}
                        >
                          Withdraw
                        </Button>
                      </Stack>

                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Button
                          size="small"
                          startIcon={<ReceiptLongRoundedIcon fontSize="small" />}
                          onClick={() => handleOpenStatement(acc)}
                          sx={{ textTransform: "none", fontWeight: 700, color: "#4f46e5" }}
                        >
                          Statement
                        </Button>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" onClick={() => handleOpenEditAccount(acc)}>
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => handleDeleteAccount(acc)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* ─── ALL BANK TRANSACTIONS AUDIT TABLE ─── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          bgcolor: "#ffffff",
        }}
      >
        <Box sx={{ p: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                Bank Transactions Ledger
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Real-time synchronized transactions across sales, purchases, khata, and expenses
              </Typography>
            </Grid>

            {/* Filters */}
            <Grid item xs={12} sm={8}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                <TextField
                  size="small"
                  placeholder="Search reference, description..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 200 }}
                />

                <TextField
                  select
                  size="small"
                  value={txFilterAccount}
                  onChange={(e) => setTxFilterAccount(e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  <MenuItem value="all">All Bank Accounts</MenuItem>
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.bankName} ({a.accountNumber.slice(-4)})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  value={txFilterType}
                  onChange={(e) => setTxFilterType(e.target.value)}
                  sx={{ minWidth: 130 }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="deposit">Deposits (+)</MenuItem>
                  <MenuItem value="withdrawal">Withdrawals (-)</MenuItem>
                </TextField>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Bank Account</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Balance After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: "text.secondary" }}>
                    No bank transactions found matching the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{tx.date}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#1e293b" }}>
                      {tx.bankAccount ? `${tx.bankAccount.bankName} (${tx.bankAccount.accountNumber})` : `Account #${tx.bankAccountId}`}
                    </TableCell>
                    <TableCell>{tx.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.type === "deposit" ? "Inflow (+)" : "Outflow (-)"}
                        size="small"
                        color={tx.type === "deposit" ? "success" : "error"}
                        variant="outlined"
                        sx={{ fontWeight: 700, fontSize: "0.72rem" }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#475569" }}>
                      {tx.reference || "-"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem", maxWidth: 240 }}>
                      {tx.description || "-"}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        color: tx.type === "deposit" ? "#059669" : "#dc2626",
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
      </Card>

      {/* ─── MODAL 1: ADD / EDIT BANK ACCOUNT ─── */}
      <Dialog
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>{editingAccount ? "Edit Bank Account" : "Add New Bank Account"}</span>
            <IconButton onClick={() => setAccountModalOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSaveAccount}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {/* Bank Name */}
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  freeSolo
                  options={PAK_BANKS}
                  value={accForm.bankName}
                  onChange={(e, val) => setAccForm({ ...accForm, bankName: val || "" })}
                  onInputChange={(e, val) => setAccForm({ ...accForm, bankName: val || "" })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      size="small"
                      label="Bank Name"
                      placeholder="Select or type e.g. Meezan Bank, HBL"
                    />
                  )}
                />
              </Grid>

              {/* Account Title */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Account Title"
                  placeholder="e.g. Usama Saeed Tyre Shop"
                  value={accForm.accountTitle}
                  onChange={(e) => setAccForm({ ...accForm, accountTitle: e.target.value })}
                />
              </Grid>

              {/* Account Number */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Account Number"
                  placeholder="e.g. 01020304050607"
                  value={accForm.accountNumber}
                  onChange={(e) => setAccForm({ ...accForm, accountNumber: e.target.value })}
                />
              </Grid>

              {/* Branch */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Branch (Optional)"
                  placeholder="e.g. Circular Road Branch"
                  value={accForm.branch}
                  onChange={(e) => setAccForm({ ...accForm, branch: e.target.value })}
                />
              </Grid>

              {/* IBAN */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="IBAN (24 Characters - Optional)"
                  placeholder="PK00MEZN0000000000000000"
                  value={accForm.iban}
                  onChange={(e) => setAccForm({ ...accForm, iban: e.target.value })}
                />
              </Grid>

              {/* Opening Balance (Only for new account) */}
              {!editingAccount && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Opening Balance (PKR)"
                    type="number"
                    value={accForm.openingBalance}
                    onChange={(e) => setAccForm({ ...accForm, openingBalance: e.target.value })}
                    helperText="Initial cash already in the account"
                  />
                </Grid>
              )}

              {/* Status */}
              <Grid item xs={12} sm={editingAccount ? 12 : 6}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={accForm.status}
                  onChange={(e) => setAccForm({ ...accForm, status: e.target.value })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes / Description"
                  placeholder="e.g. Primary company account for wholesale purchases"
                  value={accForm.notes}
                  onChange={(e) => setAccForm({ ...accForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0 }}>
            <Button onClick={() => setAccountModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "#4f46e5", fontWeight: 700, borderRadius: 2, textTransform: "none" }}
            >
              {editingAccount ? "Update Account" : "Save Bank Account"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL 2: MANUAL DEPOSIT / WITHDRAWAL ─── */}
      <Dialog
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>
              {depositForm.type === "deposit" ? "Deposit Funds to Bank" : "Withdraw Funds from Bank"}
            </span>
            <IconButton onClick={() => setDepositModalOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSaveDepositWithdraw}>
          <DialogContent sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              {/* Type Toggle */}
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Button
                    fullWidth
                    variant={depositForm.type === "deposit" ? "contained" : "outlined"}
                    color="success"
                    startIcon={<ArrowDownwardRoundedIcon />}
                    onClick={() => setDepositForm({ ...depositForm, type: "deposit", category: "Direct Cash Deposit" })}
                    sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                  >
                    Deposit (Inflow)
                  </Button>
                  <Button
                    fullWidth
                    variant={depositForm.type === "withdrawal" ? "contained" : "outlined"}
                    color="error"
                    startIcon={<ArrowUpwardRoundedIcon />}
                    onClick={() => setDepositForm({ ...depositForm, type: "withdrawal", category: "Direct Cash Withdrawal" })}
                    sx={{ fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                  >
                    Withdrawal (Outflow)
                  </Button>
                </Stack>
              </Grid>

              {/* Target Bank Account */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Select Bank Account"
                  value={depositForm.bankAccountId}
                  onChange={(e) => setDepositForm({ ...depositForm, bankAccountId: e.target.value })}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.bankName} ({a.accountNumber}) - PKR {Number(a.currentBalance || 0).toLocaleString()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Amount (PKR)"
                  type="number"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                />
              </Grid>

              {/* Category */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Transaction Category"
                  value={depositForm.category}
                  onChange={(e) => setDepositForm({ ...depositForm, category: e.target.value })}
                >
                  {depositForm.type === "deposit" ? (
                    [
                      <MenuItem key="1" value="Direct Cash Deposit">Cash Deposit from Counter Drawer</MenuItem>,
                      <MenuItem key="2" value="Owner Equity / Capital">Owner Equity / Capital Injection</MenuItem>,
                      <MenuItem key="3" value="Customer Bank Payment">Customer Bank Transfer</MenuItem>,
                      <MenuItem key="4" value="Bank Profit / Interest">Bank Profit / Interest</MenuItem>,
                      <MenuItem key="5" value="General Deposit">Other Deposit</MenuItem>,
                    ]
                  ) : (
                    [
                      <MenuItem key="1" value="Direct Cash Withdrawal">ATM / Cash Withdrawal to Drawer</MenuItem>,
                      <MenuItem key="2" value="Bank Charges & Taxes">Bank Charges, WHT, SMS Fee</MenuItem>,
                      <MenuItem key="3" value="Owner Drawing">Owner Drawing / Personal</MenuItem>,
                      <MenuItem key="4" value="Supplier Payment">Supplier Bank Payment</MenuItem>,
                      <MenuItem key="5" value="General Withdrawal">Other Withdrawal</MenuItem>,
                    ]
                  )}
                </TextField>
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Date"
                  value={depositForm.date}
                  onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Reference */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reference / Cheque / Deposit Slip #"
                  placeholder="e.g. SLIP-44910, CHQ-0021"
                  value={depositForm.reference}
                  onChange={(e) => setDepositForm({ ...depositForm, reference: e.target.value })}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description / Remarks"
                  placeholder="e.g. Deposited day cash into Meezan account"
                  value={depositForm.description}
                  onChange={(e) => setDepositForm({ ...depositForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0 }}>
            <Button onClick={() => setDepositModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                bgcolor: depositForm.type === "deposit" ? "#10b981" : "#dc2626",
                fontWeight: 700,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": { bgcolor: depositForm.type === "deposit" ? "#059669" : "#b91c1c" },
              }}
            >
              Confirm {depositForm.type === "deposit" ? "Deposit" : "Withdrawal"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL 3: INTER-BANK TRANSFER ─── */}
      <Dialog
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <span>Inter-Bank Funds Transfer (بینک سے دوسرے بینک)</span>
            <IconButton onClick={() => setTransferModalOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <form onSubmit={handleSaveTransfer}>
          <DialogContent sx={{ pt: 1 }}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              Funds will be automatically withdrawn from the source bank account and deposited into the destination bank account in a single transaction.
            </Alert>
            <Grid container spacing={2}>
              {/* From Account */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="From Account (Source)"
                  value={transferForm.fromAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.bankName} ({a.accountNumber}) - PKR {Number(a.currentBalance || 0).toLocaleString()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* To Account */}
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  required
                  label="To Account (Destination)"
                  value={transferForm.toAccountId}
                  onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                >
                  {accounts.map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.bankName} ({a.accountNumber}) - PKR {Number(a.currentBalance || 0).toLocaleString()}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Amount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Transfer Amount (PKR)"
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                />
              </Grid>

              {/* Date */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  type="date"
                  label="Transfer Date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Reference */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Transfer Ref / IBFT #"
                  placeholder="e.g. IBFT-98129, Cheque # 102"
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm({ ...transferForm, reference: e.target.value })}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Notes / Reason"
                  placeholder="e.g. Rebalance liquid funds for tyre purchase"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0 }}>
            <Button onClick={() => setTransferModalOpen(false)} sx={{ textTransform: "none", color: "text.secondary" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ bgcolor: "#4f46e5", fontWeight: 700, borderRadius: 2, textTransform: "none", "&:hover": { bgcolor: "#4338ca" } }}
            >
              Execute Transfer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ─── MODAL 4: ACCOUNT STATEMENT & HISTORY (PRINTABLE) ─── */}
      <Dialog
        open={statementModalOpen}
        onClose={() => setStatementModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AccountBalanceRoundedIcon sx={{ color: "#4f46e5" }} />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Bank Account Statement & Passbook
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={handlePrintStatement}
              sx={{ bgcolor: "#4f46e5", fontWeight: 700, textTransform: "none" }}
            >
              Print Statement
            </Button>
            <IconButton onClick={() => setStatementModalOpen(false)} size="small">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          {statementLoading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={36} sx={{ color: "#4f46e5" }} />
            </Box>
          ) : (
            <Box id="printable-bank-statement" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
              {/* Header */}
              <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                  Usama Saeed Tyre Shop
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  BANK ACCOUNT TRANSACTION STATEMENT
                </Typography>
                <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                  Statement Date: <strong>{new Date().toLocaleDateString()}</strong> • Generated: {new Date().toLocaleTimeString()}
                </Typography>
              </Box>

              {/* Account Details */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc" }}>
                    <Typography variant="caption" sx={{ color: "#666", fontWeight: 700 }}>
                      BANK & BRANCH
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {statementData?.bankName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#444" }}>
                      Branch: {statementData?.branch || "Main"}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc" }}>
                    <Typography variant="caption" sx={{ color: "#666", fontWeight: 700 }}>
                      ACCOUNT HOLDER & NUMBER
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {statementData?.accountTitle}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", color: "#444" }}>
                      Acc: {statementData?.accountNumber}
                    </Typography>
                    {statementData?.iban && (
                      <Typography variant="caption" sx={{ fontFamily: "monospace", display: "block" }}>
                        IBAN: {statementData.iban}
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000", bgcolor: "#f8fafc" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                          CURRENT AVAILABLE BALANCE:
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: "#000" }}>
                          PKR {Number(statementData?.currentBalance || 0).toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                          TOTAL TRANSACTIONS LOGGED:
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {statementData?.transactions?.length || 0} Entries
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>

              {/* Transactions Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                Transaction History Ledger:
              </Typography>
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#eee" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Deposit (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Withdrawal (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Balance (PKR)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!statementData?.transactions || statementData.transactions.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3, color: "#666" }}>
                        No transactions recorded for this bank account.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statementData.transactions.map((tx, idx) => {
                      const isDep = tx.type === "deposit";
                      return (
                        <TableRow key={tx.id || idx}>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{tx.date}</TableCell>
                          <TableCell>{tx.category}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace" }}>{tx.reference || "-"}</TableCell>
                          <TableCell sx={{ color: "#333" }}>{tx.description || "-"}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: isDep ? "#059669" : "#888" }}>
                            {isDep ? `+ PKR ${Number(tx.amount || 0).toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: !isDep ? "#dc2626" : "#888" }}>
                            {!isDep ? `- PKR ${Number(tx.amount || 0).toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800 }}>
                            PKR {Number(tx.balanceAfter || 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {/* Signatures */}
              <Box sx={{ mt: 5, pt: 2, borderTop: "1px dashed #999" }}>
                <Grid container spacing={4}>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Prepared By (Accountant / Cashier)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Authorized By (Proprietor / Manager)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
