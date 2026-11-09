import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  TextField,
  Button,
  Chip,
  Stack,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Tooltip,
} from "@mui/material";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import AssignmentReturnRoundedIcon from "@mui/icons-material/AssignmentReturnRounded";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TireRepairRoundedIcon from "@mui/icons-material/TireRepairRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import MenuItem from "@mui/material/MenuItem";

import { useDispatch, useSelector } from "react-redux";
import { getAllItemRecord } from "../features/Data/StockSlice";
import { getAllCustomerRecord } from "../features/Data/CustomerSlice";
import { getAllSalesRecords } from "../features/Data/SalesSlice";
import { getAllAccRecRecord } from "../features/Data/AccSlice";

import salesReturnApi from "../api/SalesReturnApi";
import * as bankApi from "../api/BankAccountApi";

export default function SalesReturn({ setRender }) {
  const dispatch = useDispatch();

  const rawItems = useSelector((state) => state.stock?.rawItems || []);
  const rawCustomers = useSelector((state) => state.customer?.rawCustomers || []);
  const customers = useSelector((state) => state.customer?.data || []);

  const [returnType, setReturnType] = useState("exchange"); // "return" (wapsi) or "exchange" (tabdili)
  const [loading, setLoading] = useState(false);
  const [returnHistory, setReturnHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");

  // Customer Details
  const [customerDetail, setCustomerDetails] = useState({
    customerId: null,
    name: "",
    phone: "",
    invoiceNo: "",
  });

  // Items to return (Customer gives back to shop)
  const [returnedItems, setReturnedItems] = useState([]);
  const [returnInput, setReturnInput] = useState({
    itemId: null,
    brand: "",
    pattern: "",
    size: "",
    quantity: "1",
    unitPrice: "",
    reason: "Customer preference",
  });

  // Replacement items (Shop gives new tyre to customer - in Exchange mode)
  const [replacementItems, setReplacementItems] = useState([]);
  const [replaceInput, setReplaceInput] = useState({
    itemId: null,
    brand: "",
    pattern: "",
    size: "",
    quantity: "1",
    unitPrice: "",
  });

  // Settlement Mode & Bank Account
  const [settlementMode, setSettlementMode] = useState("customer_paid_cash");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  // Printable Receipt Modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const fetchReturns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salesReturnApi.getAllSalesReturns();
      setReturnHistory(res.data || []);
    } catch (err) {
      console.error("Failed to load sales returns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await bankApi.getAllBankAccounts();
      const list = res.data || [];
      setBankAccounts(list);
      if (list.length > 0 && !selectedBankAccountId) {
        setSelectedBankAccountId(list[0].id);
      }
    } catch (err) {
      console.warn("Could not fetch bank accounts:", err);
    }
  }, [selectedBankAccountId]);

  useEffect(() => {
    dispatch(getAllItemRecord());
    dispatch(getAllCustomerRecord());
    dispatch(getAllSalesRecords());
    dispatch(getAllAccRecRecord());
    fetchReturns();
    fetchBankAccounts();
  }, [dispatch, fetchReturns, fetchBankAccounts]);

  // Tyre options for dropdown
  const tyreOptions = useMemo(() => {
    return (rawItems || []).map((i) => ({
      id: i.id,
      label: `${i.brand ? i.brand + " " : ""}${i.pattern || i.name || "Tyre"} - ${i.size} (Stock: ${i.quantity}) - PKR ${Number(i.price || 0).toLocaleString()}`,
      brand: i.brand || "",
      pattern: i.pattern || i.name || "",
      size: i.size || "",
      price: Number(i.price || 0),
      quantity: Number(i.quantity || 0),
    }));
  }, [rawItems]);

  // Customer options
  const customerOptions = useMemo(() => {
    if (rawCustomers && rawCustomers.length > 0) {
      return rawCustomers.map((c) => ({
        id: c.id,
        label: `${c.name || "Customer"}${c.phone ? ` (${c.phone})` : ""}`,
        name: c.name || "",
        phone: c.phone || "",
      }));
    }
    return (customers || []).map((c) => {
      const id = Array.isArray(c) ? c[0] : c.id;
      const name = Array.isArray(c) ? c[1] : c.name;
      const phone = Array.isArray(c) ? c[2] : c.phone;
      return {
        id,
        label: `${name || "Customer"}${phone ? ` (${phone})` : ""}`,
        name: name || "",
        phone: phone || "",
      };
    });
  }, [rawCustomers, customers]);

  // Calculate totals
  const totalReturnValue = returnedItems.reduce((acc, curr) => acc + (Number(curr.lineTotal) || 0), 0);
  const totalReplacementValue = returnType === "exchange"
    ? replacementItems.reduce((acc, curr) => acc + (Number(curr.lineTotal) || 0), 0)
    : 0;
  const netDifference = Math.round((totalReplacementValue - totalReturnValue) * 100) / 100;

  // Set intelligent default settlement mode based on difference
  useEffect(() => {
    if (returnType === "return") {
      setSettlementMode("cash_refund");
    } else {
      if (netDifference > 0) {
        setSettlementMode("customer_paid_cash");
      } else if (netDifference < 0) {
        setSettlementMode("cash_refund");
      } else {
        setSettlementMode("even_exchange");
      }
    }
  }, [returnType, netDifference]);

  // Add Item to Returned List
  const handleAddReturnedItem = () => {
    if (!returnInput.size || !returnInput.unitPrice || Number(returnInput.quantity || 0) <= 0) {
      alert("Please select tyre size, valid price, and quantity.");
      return;
    }

    const q = Number(returnInput.quantity || 1);
    const p = Number(returnInput.unitPrice || 0);

    setReturnedItems((prev) => [
      ...prev,
      {
        itemId: returnInput.itemId,
        brand: returnInput.brand || "Standard",
        pattern: returnInput.pattern || "",
        size: returnInput.size,
        quantity: q,
        unitPrice: p,
        lineTotal: q * p,
        reason: returnInput.reason,
      },
    ]);

    // Reset return input
    setReturnInput({
      itemId: null,
      brand: "",
      pattern: "",
      size: "",
      quantity: "1",
      unitPrice: "",
      reason: "Customer preference",
    });
  };

  const handleRemoveReturnedItem = (idx) => {
    setReturnedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Add Item to Replacement List (Exchange)
  const handleAddReplacementItem = () => {
    if (!replaceInput.size || !replaceInput.unitPrice || Number(replaceInput.quantity || 0) <= 0) {
      alert("Please select replacement tyre size, valid price, and quantity.");
      return;
    }

    const q = Number(replaceInput.quantity || 1);
    const p = Number(replaceInput.unitPrice || 0);

    setReplacementItems((prev) => [
      ...prev,
      {
        itemId: replaceInput.itemId,
        brand: replaceInput.brand || "Standard",
        pattern: replaceInput.pattern || "",
        size: replaceInput.size,
        quantity: q,
        unitPrice: p,
        lineTotal: q * p,
      },
    ]);

    // Reset replacement input
    setReplaceInput({
      itemId: null,
      brand: "",
      pattern: "",
      size: "",
      quantity: "1",
      unitPrice: "",
    });
  };

  const handleRemoveReplacementItem = (idx) => {
    setReplacementItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit Return or Exchange
  const handleSubmitReturn = async () => {
    if (returnedItems.length === 0) {
      alert("Please add at least one returned tyre.");
      return;
    }

    if (returnType === "exchange" && replacementItems.length === 0) {
      alert("In exchange mode, please add at least one replacement tyre.");
      return;
    }

    try {
      setLoading(true);
      const isBankSettlement = settlementMode === "bank_refund" || settlementMode === "customer_paid_bank";
      const selectedBank = isBankSettlement
        ? bankAccounts.find((b) => String(b.id) === String(selectedBankAccountId))
        : null;

      const payload = {
        type: returnType,
        customerId: customerDetail.customerId,
        customerName: customerDetail.name || "Walk-in Customer",
        customerPhone: customerDetail.phone || "",
        invoiceNo: customerDetail.invoiceNo || null,
        returnedItems,
        replacementItems: returnType === "exchange" ? replacementItems : [],
        returnTotal: totalReturnValue,
        replacementTotal: totalReplacementValue,
        netDifference,
        settlementMode,
        settledAmount: returnType === "return" ? totalReturnValue : Math.abs(netDifference),
        reason: returnedItems[0]?.reason || "Customer Return",
        date: new Date().toISOString().slice(0, 10),
        notes: returnNotes,
        bankAccountId: isBankSettlement && selectedBank ? selectedBank.id : null,
        bankName: isBankSettlement && selectedBank ? selectedBank.bankName : "",
      };

      const res = await salesReturnApi.createSalesReturn(payload);

      // Refresh stock inventory, customer list, accounts receivable
      dispatch(getAllItemRecord());
      dispatch(getAllAccRecRecord());
      dispatch(getAllCustomerRecord());
      fetchReturns();

      // Open Receipt
      setLastReceipt(res.data);
      setReceiptModalOpen(true);

      // Reset Form
      setReturnedItems([]);
      setReplacementItems([]);
      setCustomerDetails({ customerId: null, name: "", phone: "", invoiceNo: "" });
      setReturnNotes("");
    } catch (err) {
      alert("Error processing return/exchange: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete / Revert Return
  const handleDeleteReturn = async (id) => {
    if (window.confirm("Are you sure? This will delete this return and revert all inventory stock changes!")) {
      try {
        await salesReturnApi.deleteSalesReturn(id);
        dispatch(getAllItemRecord());
        fetchReturns();
      } catch (err) {
        alert("Error deleting return: " + err.message);
      }
    }
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return returnHistory;
    const q = historySearch.toLowerCase();
    return returnHistory.filter((r) => {
      return (
        (r.returnNo && r.returnNo.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.invoiceNo && r.invoiceNo.toLowerCase().includes(q))
      );
    });
  }, [returnHistory, historySearch]);

  return (
    <Box sx={{ pb: 6 }}>
      {/* ─── HEADER ─── */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 3.5,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
          boxShadow: "0 10px 30px -10px rgba(15, 23, 42, 0.3)",
        }}
      >
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <PublishedWithChangesRoundedIcon sx={{ color: "#38bdf8", fontSize: 30 }} />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Tyre Return & Exchange (Wapsi & Tabdili)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#94a3b8", maxWidth: 640 }}>
              Process customer tyre returns, warranty claims, and size exchanges. Returned tyres are automatically restocked into warehouse inventory and payments reconciled with cash or Khata.
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button
                variant={returnType === "exchange" ? "contained" : "outlined"}
                startIcon={<SwapHorizRoundedIcon />}
                onClick={() => setReturnType("exchange")}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  bgcolor: returnType === "exchange" ? "#38bdf8" : "transparent",
                  color: returnType === "exchange" ? "#0f172a" : "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": { bgcolor: "#0284c7", color: "#ffffff" },
                }}
              >
                Tyre Exchange (Tabdili)
              </Button>
              <Button
                variant={returnType === "return" ? "contained" : "outlined"}
                startIcon={<AssignmentReturnRoundedIcon />}
                onClick={() => setReturnType("return")}
                sx={{
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  bgcolor: returnType === "return" ? "#ef4444" : "transparent",
                  color: "#ffffff",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": { bgcolor: "#dc2626" },
                }}
              >
                Tyre Return (Wapsi)
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* ─── CUSTOMER SELECTION & INVOICE LOOKUP ─── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "#ffffff" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}>
          Customer & Invoice Reference
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              freeSolo
              size="small"
              options={customerOptions}
              getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
              onChange={(e, val) => {
                if (!val) {
                  setCustomerDetails((prev) => ({ ...prev, customerId: null, name: "" }));
                } else if (typeof val === "string") {
                  setCustomerDetails((prev) => ({ ...prev, customerId: null, name: val }));
                } else {
                  setCustomerDetails((prev) => ({
                    ...prev,
                    customerId: val.id,
                    name: val.name,
                    phone: val.phone || prev.phone,
                  }));
                }
              }}
              onInputChange={(e, val, reason) => {
                if (reason === "input") {
                  setCustomerDetails((prev) => ({ ...prev, customerId: null, name: val }));
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Customer Name" placeholder="Select or type customer name..." />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Customer Phone"
              value={customerDetail.phone}
              onChange={(e) => setCustomerDetails((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="e.g. 0300-1234567"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              label="Original Invoice # (Optional)"
              value={customerDetail.invoiceNo}
              onChange={(e) => setCustomerDetails((prev) => ({ ...prev, invoiceNo: e.target.value }))}
              placeholder="e.g. INV-1045 or Sale ID"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── TWO COLUMNS: RETURNED TYRES (LEFT) & REPLACEMENT TYRES (RIGHT) ─── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* LEFT COLUMN: RETURNED TYRES */}
        <Grid item xs={12} md={returnType === "exchange" ? 6 : 12}>
          <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "rgba(239, 68, 68, 0.3)", height: "100%" }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <AssignmentReturnRoundedIcon sx={{ color: "#ef4444" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#991b1b" }}>
                1. Returned Tyres (Tyre wapas li gayi)
              </Typography>
            </Stack>

            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <Autocomplete
                  size="small"
                  options={tyreOptions}
                  getOptionLabel={(option) => option.label || ""}
                  onChange={(e, val) => {
                    if (val) {
                      setReturnInput((prev) => ({
                        ...prev,
                        itemId: val.id,
                        brand: val.brand,
                        pattern: val.pattern,
                        size: val.size,
                        unitPrice: String(val.price || ""),
                      }));
                    }
                  }}
                  renderInput={(params) => <TextField {...params} label="Select Tyre from Inventory" placeholder="Tyre model & size..." />}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Tyre Size"
                  value={returnInput.size}
                  onChange={(e) => setReturnInput((prev) => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g. 195/65 R15"
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Brand"
                  value={returnInput.brand}
                  onChange={(e) => setReturnInput((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g. Michelin"
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Quantity"
                  value={returnInput.quantity}
                  onChange={(e) => setReturnInput((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </Grid>

              <Grid item xs={6} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Unit Refund Price (PKR)"
                  value={returnInput.unitPrice}
                  onChange={(e) => setReturnInput((prev) => ({ ...prev, unitPrice: e.target.value }))}
                  placeholder="PKR per tyre"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Return Reason"
                  value={returnInput.reason}
                  onChange={(e) => setReturnInput((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Wrong size, Changed mind"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<AssignmentReturnRoundedIcon />}
                  onClick={handleAddReturnedItem}
                  sx={{ fontWeight: 700, borderRadius: 2 }}
                >
                  Add to Returned Items
                </Button>
              </Grid>
            </Grid>

            {/* Returned Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: "rgba(239, 68, 68, 0.05)" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Tyre & Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No returned tyres added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    returnedItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {item.brand} {item.size}
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {item.reason}
                          </Typography>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>PKR {item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#dc2626" }}>
                          PKR {item.lineTotal.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error" onClick={() => handleRemoveReturnedItem(idx)}>
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#991b1b" }}>
                Total Return Credit: PKR {totalReturnValue.toLocaleString()}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: REPLACEMENT TYRES (IN EXCHANGE MODE) */}
        {returnType === "exchange" && (
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid", borderColor: "rgba(16, 185, 129, 0.3)", height: "100%" }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <TireRepairRoundedIcon sx={{ color: "#10b981" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#065f46" }}>
                  2. Replacement Tyres (Nayi tyre di gayi)
                </Typography>
              </Stack>

              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <Autocomplete
                    size="small"
                    options={tyreOptions}
                    getOptionLabel={(option) => option.label || ""}
                    onChange={(e, val) => {
                      if (val) {
                        setReplaceInput((prev) => ({
                          ...prev,
                          itemId: val.id,
                          brand: val.brand,
                          pattern: val.pattern,
                          size: val.size,
                          unitPrice: String(val.price || ""),
                        }));
                      }
                    }}
                    renderInput={(params) => <TextField {...params} label="Select Replacement Tyre from Stock" placeholder="Tyre model & size..." />}
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Tyre Size"
                    value={replaceInput.size}
                    onChange={(e) => setReplaceInput((prev) => ({ ...prev, size: e.target.value }))}
                    placeholder="e.g. 205/65 R15"
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Brand"
                    value={replaceInput.brand}
                    onChange={(e) => setReplaceInput((prev) => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g. Bridgestone"
                  />
                </Grid>

                <Grid item xs={6} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Quantity"
                    value={replaceInput.quantity}
                    onChange={(e) => setReplaceInput((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </Grid>

                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Unit Sale Price (PKR)"
                    value={replaceInput.unitPrice}
                    onChange={(e) => setReplaceInput((prev) => ({ ...prev, unitPrice: e.target.value }))}
                    placeholder="PKR per tyre"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<AddShoppingCartRoundedIcon />}
                    onClick={handleAddReplacementItem}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                  >
                    Add to Replacement Items
                  </Button>
                </Grid>
              </Grid>

              {/* Replacement Table */}
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "rgba(16, 185, 129, 0.05)" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tyre & Size</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {replacementItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          No replacement tyres added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      replacementItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ fontWeight: 700 }}>
                            {item.brand} {item.size}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>PKR {item.unitPrice.toLocaleString()}</TableCell>
                          <TableCell sx={{ fontWeight: 800, color: "#059669" }}>
                            PKR {item.lineTotal.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="small" color="error" onClick={() => handleRemoveReplacementItem(idx)}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: "right" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#065f46" }}>
                  Total Replacement Cost: PKR {totalReplacementValue.toLocaleString()}
                </Typography>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* ─── FINANCIAL SETTLEMENT & CHECKOUT SECTION ─── */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid", borderColor: "divider", bgcolor: "#ffffff" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
          Financial Settlement & Payment Resolution
        </Typography>

        <Grid container spacing={3} alignItems="center">
          {/* Summary Box */}
          <Grid item xs={12} md={6}>
            {returnType === "return" ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2">
                  Total Cash Refund Due to Customer: <strong>PKR {totalReturnValue.toLocaleString()}</strong>
                </Typography>
              </Alert>
            ) : (
              <Box>
                {netDifference > 0 && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      New tyres cost more. <strong>Customer to Pay Difference: PKR {netDifference.toLocaleString()}</strong>
                    </Typography>
                  </Alert>
                )}
                {netDifference < 0 && (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      New tyres cost less. <strong>Shop to Refund Difference: PKR {Math.abs(netDifference).toLocaleString()}</strong>
                    </Typography>
                  </Alert>
                )}
                {netDifference === 0 && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      Even Exchange! <strong>Net Difference: PKR 0</strong> (No payment exchange needed).
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}
          </Grid>

          {/* Payment Method Radio Group & Bank Account */}
          <Grid item xs={12} md={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 0.5 }}>
                Settlement Method:
              </FormLabel>
              <RadioGroup
                row
                value={settlementMode}
                onChange={(e) => setSettlementMode(e.target.value)}
              >
                {returnType === "return" ? (
                  <>
                    <FormControlLabel value="cash_refund" control={<Radio size="small" />} label="Cash Refund (Naqad)" />
                    <FormControlLabel value="bank_refund" control={<Radio size="small" />} label="Bank Refund (Transfer)" />
                    <FormControlLabel value="khata_credit" control={<Radio size="small" />} label="Customer Khata Credit (Udhar kam)" />
                  </>
                ) : (
                  <>
                    {netDifference > 0 && (
                      <>
                        <FormControlLabel value="customer_paid_cash" control={<Radio size="small" />} label="Customer Paid Cash" />
                        <FormControlLabel value="customer_paid_bank" control={<Radio size="small" />} label="Customer Paid Bank Transfer" />
                        <FormControlLabel value="customer_khata_due" control={<Radio size="small" />} label="Add to Customer Khata" />
                      </>
                    )}
                    {netDifference < 0 && (
                      <>
                        <FormControlLabel value="cash_refund" control={<Radio size="small" />} label="Refund Cash to Customer" />
                        <FormControlLabel value="bank_refund" control={<Radio size="small" />} label="Refund via Bank Account" />
                        <FormControlLabel value="khata_credit" control={<Radio size="small" />} label="Credit to Customer Khata" />
                      </>
                    )}
                    {netDifference === 0 && (
                      <FormControlLabel value="even_exchange" control={<Radio size="small" />} label="Even Swap (Barabar)" />
                    )}
                  </>
                )}
              </RadioGroup>
            </FormControl>

            {(settlementMode === "bank_refund" || settlementMode === "customer_paid_bank") && (
              <Box sx={{ mt: 1.5, p: 1.5, bgcolor: "rgba(79, 70, 229, 0.05)", borderRadius: 2, border: "1px solid rgba(79, 70, 229, 0.2)" }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#4f46e5", display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
                  <AccountBalanceRoundedIcon fontSize="small" /> Select Shop Bank Account:
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={selectedBankAccountId}
                  onChange={(e) => setSelectedBankAccountId(e.target.value)}
                  sx={{ bgcolor: "#ffffff" }}
                >
                  {bankAccounts.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      <strong>{b.bankName}</strong> — {b.accountNumber} ({b.accountTitle}) • Bal: PKR {Number(b.currentBalance || 0).toLocaleString()}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Transaction Notes (Optional)"
              placeholder="e.g. Swapped under 7-day fitment guarantee"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sx={{ textAlign: "right" }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<CheckCircleRoundedIcon />}
              onClick={handleSubmitReturn}
              disabled={loading || returnedItems.length === 0}
              sx={{
                bgcolor: returnType === "exchange" ? "#0284c7" : "#ef4444",
                fontWeight: 800,
                borderRadius: 2.5,
                px: 4,
                py: 1.2,
                textTransform: "none",
                "&:hover": { bgcolor: returnType === "exchange" ? "#0369a1" : "#dc2626" },
              }}
            >
              {loading ? "Processing..." : returnType === "exchange" ? "Process Tyre Exchange & Settle" : "Process Tyre Return & Refund"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* ─── RETURN & EXCHANGE HISTORY TABLE ─── */}
      <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 2.5, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Recent Tyre Returns & Exchanges History
            </Typography>
            <TextField
              size="small"
              placeholder="Search by Return #, Customer..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              InputProps={{
                startAdornment: <SearchRoundedIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />,
              }}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />
          </Stack>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Return #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Returned Tyres</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Replacement Tyres</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Net Settlement</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    No returns or exchanges registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((r) => {
                  const rets = Array.isArray(r.returnedItems) ? r.returnedItems : JSON.parse(r.returnedItems || "[]");
                  const reps = Array.isArray(r.replacementItems) ? r.replacementItems : JSON.parse(r.replacementItems || "[]");

                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "#4f46e5" }}>{r.returnNo}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{r.date}</TableCell>
                      <TableCell>
                        <Chip
                          label={r.type === "exchange" ? "Exchange" : "Return"}
                          size="small"
                          color={r.type === "exchange" ? "info" : "error"}
                          sx={{ fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {r.customerName}
                        {r.customerPhone && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {r.customerPhone}
                          </Typography>
                        )}
                      </TableCell>
                      {/* Returned Tyres: Compact chip + View icon */}
                      <TableCell sx={{ minWidth: 140 }}>
                        {(() => {
                          const totalQty = rets.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
                          return (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={`${totalQty} tyres`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: "rgba(239, 68, 68, 0.08)", color: "#ef4444" }}
                              />
                              <Tooltip title="View Returned Tyres Breakdown">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setLastReceipt(r);
                                    setReceiptModalOpen(true);
                                  }}
                                  sx={{
                                    color: "#ef4444",
                                    bgcolor: "rgba(239, 68, 68, 0.1)",
                                    border: "1px solid rgba(239, 68, 68, 0.25)",
                                    "&:hover": { bgcolor: "#ef4444", color: "#ffffff" },
                                  }}
                                >
                                  <VisibilityRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          );
                        })()}
                      </TableCell>

                      {/* Replacement Tyres: Compact chip + View icon */}
                      <TableCell sx={{ minWidth: 140 }}>
                        {reps.length > 0 ? (
                          (() => {
                            const totalQty = reps.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
                            return (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={`${totalQty} tyres`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: "rgba(2, 132, 199, 0.08)", color: "#0284c7" }}
                                />
                                <Tooltip title="View Replacement Tyres Breakdown">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setLastReceipt(r);
                                      setReceiptModalOpen(true);
                                    }}
                                    sx={{
                                      color: "#0284c7",
                                      bgcolor: "rgba(2, 132, 199, 0.1)",
                                      border: "1px solid rgba(2, 132, 199, 0.25)",
                                      "&:hover": { bgcolor: "#0284c7", color: "#ffffff" },
                                    }}
                                  >
                                    <VisibilityRoundedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            );
                          })()
                        ) : (
                          <Chip
                            label="None (Return Only)"
                            size="small"
                            sx={{ fontSize: "0.72rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.04)" }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>
                        PKR {Number(r.settledAmount || Math.abs(r.netDifference) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip label={r.settlementMode?.replace("_", " ")} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Receipt">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setLastReceipt(r);
                                setReceiptModalOpen(true);
                              }}
                              sx={{ color: "#4f46e5", bgcolor: "rgba(79, 70, 229, 0.08)" }}
                            >
                              <PrintRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete & Revert Stock">
                            <IconButton size="small" color="error" onClick={() => handleDeleteReturn(r.id)}>
                              <DeleteOutlineRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* ─── PRINTABLE RETURN / EXCHANGE RECEIPT MODAL ─── */}
      <Dialog
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {lastReceipt?.type === "exchange" ? "Tyre Exchange Receipt" : "Tyre Return Voucher"}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<PrintRoundedIcon />} onClick={() => window.print()} sx={{ fontWeight: 700 }}>
              Print Receipt
            </Button>
            <IconButton onClick={() => setReceiptModalOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box id="printable-return-receipt" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
            <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                USAMA SAEED TYRE SHOP
              </Typography>
              <Typography variant="caption" sx={{ display: "block", color: "#555" }}>
                Main Boulevard • Official Tyre Warranty & Return Voucher
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mt: 1 }}>
                {lastReceipt?.type === "exchange" ? "PRODUCT EXCHANGE RECEIPT" : "CUSTOMER RETURN RECEIPT"}
              </Typography>
              <Typography variant="body2">
                Return Voucher #: <strong>{lastReceipt?.returnNo}</strong> • Date: {lastReceipt?.date}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                Customer: <strong>{lastReceipt?.customerName}</strong> {lastReceipt?.customerPhone ? `(${lastReceipt?.customerPhone})` : ""}
              </Typography>
              {lastReceipt?.invoiceNo && (
                <Typography variant="body2">
                  Original Invoice: <strong>{lastReceipt?.invoiceNo}</strong>
                </Typography>
              )}
            </Box>

            {/* Returned tyres list */}
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", display: "block", mb: 0.5 }}>
              Returned Tyres Restocked:
            </Typography>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Tyre & Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const rets = Array.isArray(lastReceipt?.returnedItems) ? lastReceipt.returnedItems : JSON.parse(lastReceipt?.returnedItems || "[]");
                  return rets.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.brand} {item.size}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>PKR {Number(item.lineTotal || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>

            {/* Replacement tyres list (if exchange) */}
            {lastReceipt?.type === "exchange" && (
              <>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                  Replacement Tyres Issued:
                </Typography>
                <Table size="small" sx={{ mb: 2 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#eee" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Tyre & Size</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Charge</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const reps = Array.isArray(lastReceipt?.replacementItems) ? lastReceipt.replacementItems : JSON.parse(lastReceipt?.replacementItems || "[]");
                      return reps.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.brand} {item.size}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>PKR {Number(item.lineTotal || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Financial Settlement */}
            <Box sx={{ p: 1.5, border: "1px solid #000", bgcolor: "#f8fafc", mb: 2 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Settlement Amount:
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 900 }}>
                  PKR {Number(lastReceipt?.settledAmount || Math.abs(lastReceipt?.netDifference || 0)).toLocaleString()}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: "#444", display: "block", mt: 0.5 }}>
                Settlement Mode: <strong>{lastReceipt?.settlementMode?.replace("_", " ").toUpperCase()}</strong>
              </Typography>
            </Box>

            <Box sx={{ mt: 4, pt: 2, borderTop: "1px dashed #999", textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Thank you for choosing Usama Saeed Tyre Shop!
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
