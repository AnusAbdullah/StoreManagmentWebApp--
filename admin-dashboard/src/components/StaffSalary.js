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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import * as staffApi from "../api/StaffApi";
import * as bankApi from "../api/BankAccountApi";

const STAFF_ROLES = [
  "Salesman",
  "Tyre Fitter / Mechanic",
  "Shop Manager",
  "Accountant / Cashier",
  "Helper / Labour",
];

const PAYOUT_TYPES = ["Monthly Salary", "Advance Payment", "Commission / Bonus"];

export default function StaffSalary() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Salary Payouts & Advances, 1 = Staff Directory

  const [staffList, setStaffList] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [bankAccounts, setBankAccounts] = useState([]);
  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    staffId: "",
    staffName: "",
    amount: "",
    payoutType: "Monthly Salary",
    month: new Date().toISOString().slice(0, 7),
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash", // "cash" or "bank"
    bankAccountId: "",
    bankName: "",
    note: "",
  });

  // Staff Modal State (Add/Edit Employee)
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    id: null,
    name: "",
    phone: "",
    role: "Salesman",
    monthlySalary: "",
    hireDate: new Date().toISOString().slice(0, 10),
    status: "Active",
  });

  const loadData = async () => {
    try {
      const [staffRes, payoutsRes, bankRes] = await Promise.all([
        staffApi.getAllStaff(),
        staffApi.getAllSalaryPayouts(),
        bankApi.getBankAccounts().catch(() => ({ data: { accounts: [] } })),
      ]);
      setStaffList(Array.isArray(staffRes.data) ? staffRes.data : []);
      setPayoutsList(Array.isArray(payoutsRes.data) ? payoutsRes.data : []);
      setBankAccounts(bankRes.data?.accounts || []);
    } catch (err) {
      console.error("Failed to load staff/payouts data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle staff selection in payout form
  const handleSelectStaffForPayout = (staffIdVal) => {
    const selected = staffList.find((s) => String(s.id) === String(staffIdVal));
    if (selected) {
      setPayoutForm({
        ...payoutForm,
        staffId: selected.id,
        staffName: selected.name,
        amount: payoutForm.amount || (selected.monthlySalary ? String(selected.monthlySalary) : ""),
      });
    } else {
      setPayoutForm({ ...payoutForm, staffId: "", staffName: "" });
    }
  };

  // Submit Salary Payout
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutForm.staffId || !payoutForm.amount) {
      setErrorMsg("Please select an employee and enter payout amount.");
      return;
    }
    setErrorMsg("");

    try {
      const isBank = payoutForm.paymentMethod === "bank";
      const selectedBank = isBank
        ? bankAccounts.find((b) => String(b.id) === String(payoutForm.bankAccountId))
        : null;

      await staffApi.createSalaryPayout({
        ...payoutForm,
        staffId: Number(payoutForm.staffId),
        amount: Number(payoutForm.amount),
        paymentMethod: isBank ? "bank" : "cash",
        bankAccountId: isBank && selectedBank ? selectedBank.id : null,
        bankName: isBank && selectedBank ? selectedBank.bankName : "",
      });

      setSuccessMsg(
        `Disbursed PKR ${Number(payoutForm.amount).toLocaleString()} to ${payoutForm.staffName} (${payoutForm.payoutType})${isBank ? ` via ${selectedBank?.bankName || "Bank"}` : ""}.`
      );
      setPayoutForm({
        staffId: "",
        staffName: "",
        amount: "",
        payoutType: "Monthly Salary",
        month: new Date().toISOString().slice(0, 7),
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: "cash",
        bankAccountId: "",
        bankName: "",
        note: "",
      });
      loadData();
    } catch (err) {
      console.error("Payout error:", err);
      setErrorMsg(err?.message || "Failed to disburse salary payment.");
    }
  };

  // Submit Staff Member (Add / Edit)
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffForm.name.trim()) {
      setErrorMsg("Staff member name is required.");
      return;
    }

    try {
      const payload = {
        name: staffForm.name.trim(),
        phone: staffForm.phone.trim(),
        role: staffForm.role,
        monthlySalary: Number(staffForm.monthlySalary || 0),
        hireDate: staffForm.hireDate,
        status: staffForm.status,
      };

      if (staffForm.id) {
        await staffApi.updateStaff(staffForm.id, payload);
        setSuccessMsg(`Employee profile "${payload.name}" updated successfully.`);
      } else {
        await staffApi.createStaff(payload);
        setSuccessMsg(`New employee "${payload.name}" added successfully.`);
      }

      setStaffModalOpen(false);
      setStaffForm({
        id: null,
        name: "",
        phone: "",
        role: "Salesman",
        monthlySalary: "",
        hireDate: new Date().toISOString().slice(0, 10),
        status: "Active",
      });
      loadData();
    } catch (err) {
      console.error("Staff save error:", err);
      setErrorMsg(err?.message || "Failed to save staff record.");
    }
  };

  const handleDeletePayout = async (id) => {
    if (window.confirm("Are you sure you want to delete this salary disbursement record?")) {
      try {
        await staffApi.deleteSalaryPayout(id);
        loadData();
      } catch (err) {
        setErrorMsg("Failed to delete salary record.");
      }
    }
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Delete this staff member and all associated salary history?")) {
      try {
        await staffApi.deleteStaff(id);
        loadData();
      } catch (err) {
        setErrorMsg("Failed to delete staff member.");
      }
    }
  };

  // Metrics
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const totalMonthlyPayrollCommitment = useMemo(() => {
    return staffList
      .filter((s) => s.status === "Active")
      .reduce((sum, curr) => sum + Number(curr.monthlySalary || 0), 0);
  }, [staffList]);

  const thisMonthPaid = useMemo(() => {
    return payoutsList
      .filter((p) => String(p.date || p.month || "").startsWith(currentMonthStr))
      .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
  }, [payoutsList, currentMonthStr]);

  // Filtered lists
  const filteredPayouts = useMemo(() => {
    if (!searchValue.trim()) return payoutsList;
    const q = searchValue.toLowerCase().trim();
    return payoutsList.filter((p) => {
      const name = String(p.staffName || "").toLowerCase();
      const type = String(p.payoutType || "").toLowerCase();
      const date = String(p.date || "").toLowerCase();
      const month = String(p.month || "").toLowerCase();
      const amt = String(p.amount || "");
      return name.includes(q) || type.includes(q) || date.includes(q) || month.includes(q) || amt.includes(q);
    });
  }, [payoutsList, searchValue]);

  const filteredStaff = useMemo(() => {
    if (!searchValue.trim()) return staffList;
    const q = searchValue.toLowerCase().trim();
    return staffList.filter((s) => {
      const name = String(s.name || "").toLowerCase();
      const role = String(s.role || "").toLowerCase();
      const phone = String(s.phone || "").toLowerCase();
      return name.includes(q) || role.includes(q) || phone.includes(q);
    });
  }, [staffList, searchValue]);

  return (
    <Card sx={{ p: 1 }}>
      <CardContent>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "rgba(16, 185, 129, 0.1)",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BadgeRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Staff Management & Salary Payouts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage tyre shop workers, salesmen, helpers, and disburse monthly salaries & cash advances
              </Typography>
            </Box>
          </Stack>

          <Tabs
            value={activeTab}
            onChange={(e, val) => {
              setActiveTab(val);
              setSearchValue("");
            }}
            sx={{
              bgcolor: "#f1f5f9",
              borderRadius: 3,
              p: 0.5,
              "& .MuiTabs-indicator": { bgcolor: "#10b981", height: 3, borderRadius: 2 },
            }}
          >
            <Tab
              icon={<PaymentsRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`Salary Payouts (${payoutsList.length})`}
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: 2.5,
                textTransform: "none",
                minHeight: 40,
                "&.Mui-selected": { color: "#10b981" },
              }}
            />
            <Tab
              icon={<BadgeRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`Employees Directory (${staffList.length})`}
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: 2.5,
                textTransform: "none",
                minHeight: 40,
                "&.Mui-selected": { color: "#10b981" },
              }}
            />
          </Tabs>
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

        {/* Financial Highlights */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Monthly Payroll Commitment
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", mt: 0.5 }}>
                PKR {totalMonthlyPayrollCommitment.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Salaries & Advances Disbursed This Month
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#10b981", mt: 0.5 }}>
                PKR {thisMonthPaid.toLocaleString()}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: "#f1f5f9", border: "1px solid #cbd5e1" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Active Tyre Shop Staff
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#475569", mt: 0.5 }}>
                {staffList.filter((s) => s.status === "Active").length} Members
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ─── TAB 0: SALARY PAYOUTS & ADVANCES ─── */}
        {activeTab === 0 && (
          <>
            {/* Quick Payout Form */}
            <Box
              component="form"
              onSubmit={handlePayoutSubmit}
              sx={{
                p: 3,
                bgcolor: "#f8fafc",
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                mb: 4,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#334155" }}>
                  Disburse Salary or Cash Advance
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonAddRoundedIcon />}
                  onClick={() => {
                    setStaffForm({
                      id: null,
                      name: "",
                      phone: "",
                      role: "Salesman",
                      monthlySalary: "",
                      hireDate: new Date().toISOString().slice(0, 10),
                      status: "Active",
                    });
                    setStaffModalOpen(true);
                  }}
                  sx={{ borderRadius: 2, fontWeight: 700 }}
                >
                  Add New Employee Profile
                </Button>
              </Stack>

              <Grid container spacing={2}>
                {/* Select Staff */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Employee Name"
                    value={payoutForm.staffId}
                    onChange={(e) => handleSelectStaffForPayout(e.target.value)}
                    required
                  >
                    <MenuItem value="">-- Choose Staff Member --</MenuItem>
                    {staffList.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.name} ({s.role}) - Base: PKR {Number(s.monthlySalary || 0).toLocaleString()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Payout Type */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payout Type"
                    value={payoutForm.payoutType}
                    onChange={(e) => setPayoutForm({ ...payoutForm, payoutType: e.target.value })}
                  >
                    {PAYOUT_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Amount */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Amount (PKR)"
                    placeholder="e.g. 35000"
                    value={payoutForm.amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                    required
                  />
                </Grid>

                {/* Salary Month */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="month"
                    label="For Month"
                    value={payoutForm.month}
                    onChange={(e) => setPayoutForm({ ...payoutForm, month: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      style: { fontSize: "0.875rem" },
                    }}
                    sx={{
                      "& input::-webkit-calendar-picker-indicator": {
                        cursor: "pointer",
                      },
                    }}
                    required
                  />
                </Grid>

                {/* Payment Date */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Payment Date"
                    value={payoutForm.date}
                    onChange={(e) => setPayoutForm({ ...payoutForm, date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      style: { fontSize: "0.875rem" },
                    }}
                    sx={{
                      "& input::-webkit-calendar-picker-indicator": {
                        cursor: "pointer",
                      },
                    }}
                    required
                  />
                </Grid>

                {/* Payment Method Toggle & Account Selector */}
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: "#ffffff",
                      borderRadius: 2,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 0.5 }}>
                          PAYOUT DISBURSEMENT SOURCE:
                        </Typography>
                        <RadioGroup
                          row
                          value={payoutForm.paymentMethod || "cash"}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPayoutForm((prev) => ({
                              ...prev,
                              paymentMethod: val,
                              bankAccountId: val === "bank" ? (prev.bankAccountId || bankAccounts[0]?.id || "") : "",
                              bankName: val === "bank" ? (prev.bankName || bankAccounts[0]?.bankName || "") : "",
                            }));
                          }}
                        >
                          <FormControlLabel value="cash" control={<Radio size="small" />} label="Counter Drawer Cash" />
                          <FormControlLabel value="bank" control={<Radio size="small" />} label="Shop Bank Account (Transfer)" />
                        </RadioGroup>
                      </Grid>

                      {payoutForm.paymentMethod === "bank" && (
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Select Shop Bank Account"
                            value={payoutForm.bankAccountId || ""}
                            onChange={(e) => {
                              const bId = e.target.value;
                              const matched = bankAccounts.find((b) => String(b.id) === String(bId));
                              setPayoutForm((prev) => ({
                                ...prev,
                                bankAccountId: bId,
                                bankName: matched ? matched.bankName : "",
                              }));
                            }}
                            helperText="Salary amount will be deducted automatically from this bank account"
                          >
                            {bankAccounts.length === 0 ? (
                              <MenuItem value="" disabled>No bank accounts configured</MenuItem>
                            ) : (
                              bankAccounts.map((b) => (
                                <MenuItem key={b.id} value={b.id}>
                                  {b.bankName} - {b.accountNumber} (PKR {Number(b.currentBalance || 0).toLocaleString()})
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Grid>

                {/* Remarks / Note */}
                <Grid item xs={12} sm={6} md={9}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Notes / Voucher Remarks (Optional)"
                    placeholder="e.g. Full October salary paid in cash, or mid-month fuel advance"
                    value={payoutForm.note}
                    onChange={(e) => setPayoutForm({ ...payoutForm, note: e.target.value })}
                  />
                </Grid>

                {/* Submit Button */}
                <Grid item xs={12} sm={12} md={3}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    startIcon={<PaymentsRoundedIcon />}
                    sx={{
                      fontWeight: 800,
                      py: 1,
                      height: 40,
                      bgcolor: "#10b981",
                      "&:hover": { bgcolor: "#059669" },
                    }}
                  >
                    Post Salary Payment
                  </Button>
                </Grid>
              </Grid>
            </Box>

            {/* Payouts Table */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Salary & Advance Disbursement History
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search payouts by employee, type, or date..."
                  sx={{ minWidth: 260 }}
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
                    borderColor: "#10b981",
                    color: "#10b981",
                    "&:hover": { bgcolor: "rgba(16, 185, 129, 0.08)", borderColor: "#059669" },
                  }}
                >
                  Print Payroll Sheet
                </Button>
              </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Voucher #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payout Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>For Month</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount Disbursed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Note / Remarks</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No salary or advance disbursements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>PAY-{p.id}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{p.date}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{p.staffName}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.payoutType}
                            size="small"
                            color={p.payoutType === "Advance Payment" ? "warning" : "success"}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{p.month || "-"}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#10b981", whiteSpace: "nowrap" }}>
                          PKR {Number(p.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{p.note || "-"}</TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Tooltip title="Delete Payout">
                            <IconButton
                              size="small"
                              sx={{ color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.08)" }}
                              onClick={() => handleDeletePayout(p.id)}
                            >
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* ─── TAB 1: EMPLOYEES DIRECTORY ─── */}
        {activeTab === 1 && (
          <>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Tyre Shop Staff Profiles
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TextField
                  size="small"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search staff by name, role, or phone..."
                  sx={{ minWidth: 280 }}
                />
                <Button
                  variant="contained"
                  startIcon={<PersonAddRoundedIcon />}
                  onClick={() => {
                    setStaffForm({
                      id: null,
                      name: "",
                      phone: "",
                      role: "Salesman",
                      monthlySalary: "",
                      hireDate: new Date().toISOString().slice(0, 10),
                      status: "Active",
                    });
                    setStaffModalOpen(true);
                  }}
                  sx={{
                    fontWeight: 700,
                    bgcolor: "#10b981",
                    "&:hover": { bgcolor: "#059669" },
                  }}
                >
                  Add Employee
                </Button>
              </Stack>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Designation / Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Base Monthly Salary</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hire Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No staff members recorded yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStaff.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>EMP-{s.id}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</TableCell>
                        <TableCell>
                          <Chip label={s.role} size="small" sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }} />
                        </TableCell>
                        <TableCell sx={{ color: "#475569" }}>{s.phone || "-"}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>
                          PKR {Number(s.monthlySalary || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>{s.hireDate || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.status}
                            size="small"
                            color={s.status === "Active" ? "success" : "default"}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ pr: 2 }}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit Employee">
                              <IconButton
                                size="small"
                                sx={{ color: "#4f46e5", bgcolor: "rgba(79, 70, 229, 0.08)" }}
                                onClick={() => {
                                  setStaffForm({
                                    id: s.id,
                                    name: s.name,
                                    phone: s.phone || "",
                                    role: s.role || "Salesman",
                                    monthlySalary: s.monthlySalary || "",
                                    hireDate: s.hireDate || new Date().toISOString().slice(0, 10),
                                    status: s.status || "Active",
                                  });
                                  setStaffModalOpen(true);
                                }}
                              >
                                <EditRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Employee">
                              <IconButton
                                size="small"
                                sx={{ color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.08)" }}
                                onClick={() => handleDeleteStaff(s.id)}
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
          </>
        )}

        {/* ─── ADD/EDIT STAFF MODAL ─── */}
        <Dialog
          open={staffModalOpen}
          onClose={() => setStaffModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {staffForm.id ? "Edit Employee Profile" : "Register New Employee"}
              </Typography>
              <IconButton onClick={() => setStaffModalOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <Box component="form" onSubmit={handleStaffSubmit}>
            <DialogContent sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Employee Full Name"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone Number"
                    placeholder="0300-1234567"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Role / Designation"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  >
                    {STAFF_ROLES.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Base Monthly Salary (PKR)"
                    placeholder="e.g. 30000"
                    value={staffForm.monthlySalary}
                    onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Joining / Hire Date"
                    value={staffForm.hireDate}
                    onChange={(e) => setStaffForm({ ...staffForm, hireDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Employment Status"
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="On Leave">On Leave</MenuItem>
                    <MenuItem value="Resigned / Inactive">Resigned / Inactive</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
              <Button variant="outlined" color="inherit" onClick={() => setStaffModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ fontWeight: 800, px: 3, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
              >
                {staffForm.id ? "Update Employee" : "Save Employee"}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* ─── PAYROLL PRINT MODAL ─── */}
        <Dialog
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Staff Payroll & Salary Disbursements - Print Preview
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<PrintRoundedIcon />}
                onClick={() => window.print()}
                sx={{ fontWeight: 700, bgcolor: "#10b981", "&:hover": { bgcolor: "#059669" } }}
              >
                Print Now
              </Button>
              <IconButton onClick={() => setPrintModalOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            <Box id="printable-salary-report" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
              {/* Header */}
              <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                  Usama Saeed Tyre Shop
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  STAFF SALARY DISBURSEMENT & ADVANCES REGISTER
                </Typography>
                <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                  Report Generated: <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong> • Filtered Records: {filteredPayouts.length}
                </Typography>
              </Box>

              {/* Financial Summary */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                      ACTIVE STAFF
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {staffList.filter((s) => s.status === "Active").length} Members
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                      MONTHLY COMMITMENT
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                      PKR {totalMonthlyPayrollCommitment.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000", bgcolor: "#f8fafc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#000" }}>
                      TOTAL DISBURSED
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: "#059669" }}>
                      PKR {filteredPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Payouts Itemized Table */}
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#eee" }}>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Staff Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payout Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>For Month</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amount (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Notes / Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredPayouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No salary or advance disbursements found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayouts.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: "#666" }}>{idx + 1}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>{p.date || "-"}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{p.staffName}</TableCell>
                        <TableCell>{p.payoutType}</TableCell>
                        <TableCell>{p.month || "-"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#059669" }}>
                          PKR {Number(p.amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "#555" }}>{p.note || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                  {/* Grand Total Row */}
                  {filteredPayouts.length > 0 && (
                    <TableRow sx={{ bgcolor: "#f8fafc", borderTop: "2px solid #000" }}>
                      <TableCell colSpan={5} sx={{ fontWeight: 900, textAlign: "right" }}>
                        TOTAL DISBURSED:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: "#059669" }}>
                        PKR {filteredPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0).toLocaleString()}
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
                      Staff Recipient Signature
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Disbursed & Authorized By (Manager)
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
