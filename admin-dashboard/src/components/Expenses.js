import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Stack,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tooltip,
  IconButton,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import * as expenseApi from "../api/ExpenseApi";
import * as bankApi from "../api/BankAccountApi";

const EXPENSE_CATEGORIES = [
  "Shop Rent",
  "Electricity & Utilities",
  "Tea, Food & Refreshment",
  "Shop Maintenance & Tools",
  "Transport & Generator Fuel",
  "Petty Cash & Daily Expense",
  "Marketing & Signboard",
  "Miscellaneous",
];

const PAYMENT_MODES = ["Cash", "Bank Transfer", "Cheque", "Online / JazzCash"];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [bankAccounts, setBankAccounts] = useState([]);
  const [formState, setFormState] = useState({
    id: null,
    category: "Electricity & Utilities",
    title: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMode: "Cash",
    bankAccountId: "",
    bankName: "",
    remarks: "",
  });

  const loadExpenses = async () => {
    try {
      const { data } = await expenseApi.getAllExpenses();
      setExpenses(Array.isArray(data) ? data : []);
      const bankRes = await bankApi.getBankAccounts();
      setBankAccounts(bankRes.data?.accounts || []);
    } catch (err) {
      console.error("Failed to load expenses or bank accounts:", err);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const isEditing = formState.id !== null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title.trim() || !formState.amount) {
      setErrorMsg("Please provide an expense title and amount.");
      return;
    }
    setErrorMsg("");

    try {
      const isBank = formState.paymentMode !== "Cash" || Boolean(formState.bankAccountId);
      const selectedBank = isBank
        ? bankAccounts.find((b) => String(b.id) === String(formState.bankAccountId))
        : null;

      const payload = {
        category: formState.category,
        title: formState.title.trim(),
        amount: Number(formState.amount),
        date: formState.date,
        paymentMode: formState.paymentMode,
        bankAccountId: isBank && selectedBank ? selectedBank.id : null,
        bankName: isBank && selectedBank ? selectedBank.bankName : "",
        remarks: formState.remarks.trim(),
      };

      if (isEditing) {
        await expenseApi.updateExpense(formState.id, payload);
        setSuccessMsg(`Expense voucher "${payload.title}" updated successfully.`);
      } else {
        await expenseApi.createExpense(payload);
        setSuccessMsg(`Expense voucher "${payload.title}" recorded successfully.`);
      }

      loadExpenses();
      handleClear();
    } catch (err) {
      console.error("Expense error:", err);
      setErrorMsg(err?.message || "Failed to save expense record.");
    }
  };

  const handleEdit = (rec) => {
    setFormState({
      id: rec.id,
      category: rec.category || "Shop Rent",
      title: rec.title || "",
      amount: rec.amount || "",
      date: rec.date || new Date().toISOString().slice(0, 10),
      paymentMode: rec.paymentMode || "Cash",
      bankAccountId: rec.bankAccountId || "",
      bankName: rec.bankName || "",
      remarks: rec.remarks || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense voucher?")) {
      try {
        await expenseApi.deleteExpense(id);
        loadExpenses();
        if (formState.id === id) handleClear();
      } catch (err) {
        console.error("Delete expense error:", err);
        setErrorMsg("Failed to delete expense record.");
      }
    }
  };

  const handleClear = () => {
    setFormState({
      id: null,
      category: "Electricity & Utilities",
      title: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      paymentMode: "Cash",
      bankAccountId: "",
      bankName: "",
      remarks: "",
    });
  };

  // Metrics
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = useMemo(() => {
    return expenses
      .filter((e) => String(e.date || "").startsWith(currentMonthStr))
      .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
  }, [expenses, currentMonthStr]);

  const allTimeTotal = useMemo(() => {
    return expenses.reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
  }, [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchCat = categoryFilter === "All" || e.category === categoryFilter;
      if (!matchCat) return false;

      if (!searchValue.trim()) return true;
      const q = searchValue.toLowerCase().trim();
      const title = String(e.title || "").toLowerCase();
      const cat = String(e.category || "").toLowerCase();
      const rem = String(e.remarks || "").toLowerCase();
      const date = String(e.date || "").toLowerCase();
      const mode = String(e.paymentMode || "").toLowerCase();
      const amt = String(e.amount || "");

      return (
        title.includes(q) ||
        cat.includes(q) ||
        rem.includes(q) ||
        date.includes(q) ||
        mode.includes(q) ||
        amt.includes(q)
      );
    });
  }, [expenses, categoryFilter, searchValue]);

  return (
    <Card sx={{ p: 1 }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptLongRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Shop Operating Expenses
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Record shop rent, electricity, refreshments, fuel, and daily operational overheads
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip label={`${expenses.length} Vouchers Recorded`} color="error" variant="outlined" size="small" />
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintRoundedIcon />}
              onClick={() => setPrintModalOpen(true)}
              sx={{
                bgcolor: "#ef4444",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "#dc2626" },
              }}
            >
              Print Expense Report
            </Button>
          </Stack>
        </Stack>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2.5 }} onClose={() => setSuccessMsg("")}>
            {successMsg}
          </Alert>
        )}

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }} onClose={() => setErrorMsg("")}>
            {errorMsg}
          </Alert>
        )}

        {/* Expense Summary Highlights */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                This Month's Overhead ({new Date().toLocaleString("default", { month: "long" })})
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#ef4444", mt: 0.5 }}>
                PKR {thisMonthTotal.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f1f5f9", border: "1px solid #cbd5e1" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                All-Time Total Overhead
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                PKR {allTimeTotal.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "rgba(79, 70, 229, 0.05)", border: "1px solid rgba(79, 70, 229, 0.2)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Total Recorded Expense Vouchers
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#4f46e5", mt: 0.5 }}>
                {expenses.length} Records
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Expense Entry Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 3,
            bgcolor: "#f8fafc",
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            mb: 4,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: "#334155" }}>
            {isEditing ? `Edit Expense Voucher #${formState.id}` : "Record New Shop Expense"}
          </Typography>

          <Grid container spacing={2}>
            {/* Category */}
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Expense Category"
                value={formState.category}
                onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Title / Description */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Expense Title / Description"
                placeholder="e.g. Shop Rent for Oct, Electricity Bill"
                value={formState.title}
                onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                required
              />
            </Grid>

            {/* Amount */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Amount (PKR)"
                placeholder="e.g. 15000"
                value={formState.amount}
                onChange={(e) => setFormState({ ...formState, amount: e.target.value })}
                required
              />
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Expense Date"
                value={formState.date}
                onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>

            {/* Payment Mode */}
            <Grid item xs={12} sm={formState.paymentMode !== "Cash" ? 2 : 4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment Mode"
                value={formState.paymentMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  setFormState((prev) => ({
                    ...prev,
                    paymentMode: mode,
                    bankAccountId: mode !== "Cash" ? (prev.bankAccountId || bankAccounts[0]?.id || "") : "",
                    bankName: mode !== "Cash" ? (prev.bankName || bankAccounts[0]?.bankName || "") : "",
                  }));
                }}
              >
                {PAYMENT_MODES.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Bank Account (if not Cash) */}
            {formState.paymentMode !== "Cash" && (
              <Grid item xs={12} sm={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Shop Bank Account"
                  value={formState.bankAccountId || ""}
                  onChange={(e) => {
                    const bId = e.target.value;
                    const matched = bankAccounts.find((b) => String(b.id) === String(bId));
                    setFormState((prev) => ({
                      ...prev,
                      bankAccountId: bId,
                      bankName: matched ? matched.bankName : "",
                    }));
                  }}
                >
                  {bankAccounts.length === 0 ? (
                    <MenuItem value="" disabled>No bank accounts</MenuItem>
                  ) : (
                    bankAccounts.map((b) => (
                      <MenuItem key={b.id} value={b.id}>
                        {b.bankName} ({b.accountNumber.slice(-4)})
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
            )}

            {/* Remarks / Reference */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Remarks / Receipt Ref (Optional)"
                placeholder="e.g. Bill # 9238491, Cash voucher"
                value={formState.remarks}
                onChange={(e) => setFormState({ ...formState, remarks: e.target.value })}
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isEditing ? <EditRoundedIcon /> : <AddRoundedIcon />}
                  sx={{
                    fontWeight: 800,
                    px: 3,
                    bgcolor: "#ef4444",
                    "&:hover": { bgcolor: "#dc2626" },
                  }}
                >
                  {isEditing ? "Update Expense" : "Record Expense"}
                </Button>
                <Button variant="outlined" color="inherit" onClick={handleClear} startIcon={<ClearRoundedIcon />}>
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Filter & Search Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Expense Ledger History
            </Typography>
            <TextField
              select
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search expenses by title, category, date..."
              sx={{ minWidth: { xs: 200, sm: 300 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<PrintRoundedIcon />}
              onClick={() => setPrintModalOpen(true)}
              sx={{
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                whiteSpace: "nowrap",
                borderColor: "#ef4444",
                color: "#ef4444",
                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)", borderColor: "#dc2626" },
              }}
            >
              Print Report
            </Button>
          </Stack>
        </Stack>

        {/* Expenses Table */}
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Voucher #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expense Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {searchValue || categoryFilter !== "All"
                      ? "No expense records match your filter criteria."
                      : "No expense vouchers recorded yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>EXP-{e.id}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>{e.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={e.category}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          bgcolor: "rgba(239, 68, 68, 0.08)",
                          color: "#ef4444",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{e.title}</TableCell>
                    <TableCell sx={{ color: "#475569", fontSize: "0.85rem" }}>{e.paymentMode || "Cash"}</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: "#ef4444", whiteSpace: "nowrap" }}>
                      PKR {Number(e.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{e.remarks || "-"}</TableCell>
                    <TableCell align="right" sx={{ pr: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Edit Voucher">
                          <IconButton
                            size="small"
                            sx={{ color: "#4f46e5", bgcolor: "rgba(79, 70, 229, 0.08)" }}
                            onClick={() => handleEdit(e)}
                          >
                            <EditRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Voucher">
                          <IconButton
                            size="small"
                            sx={{ color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.08)" }}
                            onClick={() => handleDelete(e.id)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>

      {/* ─── EXPENSES PRINT MODAL ─── */}
      <Dialog
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Shop Operating Expenses Report - Print Preview
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
            >
              Print Now
            </Button>
            <IconButton onClick={() => setPrintModalOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box id="printable-expense-report" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                Usama Saeed Tyre Shop
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                SHOP OPERATING EXPENSES & OVERHEADS REPORT
              </Typography>
              <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                Report Generated: <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong> • Scope: {categoryFilter !== "All" ? `Category: ${categoryFilter}` : "All Categories"} ({filteredExpenses.length} vouchers)
              </Typography>
            </Box>

            {/* Financial Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    TOTAL VOUCHERS
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {filteredExpenses.length} Records
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    CURRENT MONTH TOTAL
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#dc2626" }}>
                    PKR {thisMonthTotal.toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000", bgcolor: "#f8fafc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#000" }}>
                    FILTERED SUM TOTAL
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: "#991b1b" }}>
                    PKR {filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Expenses Itemized Table */}
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Expense Title</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Amount (PKR)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No expenses recorded for this selection.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((e, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: "#666" }}>{idx + 1}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>{e.date || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{e.category}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{e.title}</TableCell>
                      <TableCell>{e.paymentMode || "Cash"}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#dc2626" }}>
                        PKR {Number(e.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: "#555" }}>{e.remarks || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
                {/* Grand Total Row */}
                {filteredExpenses.length > 0 && (
                  <TableRow sx={{ bgcolor: "#f8fafc", borderTop: "2px solid #000" }}>
                    <TableCell colSpan={5} sx={{ fontWeight: 900, textAlign: "right" }}>
                      TOTAL EXPENSES:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "#dc2626" }}>
                      PKR {filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Signature Area */}
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
                    Approved By (Proprietor / Manager)
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
