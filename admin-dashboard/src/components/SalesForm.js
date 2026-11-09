import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Box,
  Stack,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Autocomplete,
  Chip,
  Paper,
  Alert,
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
  IconButton,
  Tooltip,
  CircularProgress,
  MenuItem,
} from "@mui/material";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import AddShoppingCartRoundedIcon from "@mui/icons-material/AddShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import * as bankApi from "../api/BankAccountApi";
import SalesTable from "./SalesTable";
import { useDispatch, useSelector } from "react-redux";
import {
  addSales,
  deleteSales,
  editSales,
  createSales,
  resetCart,
  getAllSalesRecords,
} from "../features/Data/SalesSlice";
import { getAllCustomerRecord } from "../features/Data/CustomerSlice";
import { getAllItemRecord } from "../features/Data/StockSlice";
import { getAllAccRecRecord } from "../features/Data/AccSlice";

export default function SalesForm({ setRender }) {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customer?.data || []);
  const rawCustomers = useSelector((state) => state.customer?.rawCustomers || []);
  const rawItems = useSelector((state) => state.stock?.rawItems);
  const stockRows = useSelector((state) => state.stock?.data);
  const saleItem = useSelector((state) => state.sale?.data || []);
  const { totalBill = 0, salesHistory = [] } = useSelector((state) => state.sale || {});
  const accRecRecords = useSelector((state) => state.accRec?.data || []);

  const [activeTab, setActiveTab] = useState(0); // 0: POS Terminal, 1: Sales Invoices History
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [item, setItem] = useState({
    itemId: null,
    itemName: "",
    size: "",
    price: "",
    quantity: "4", // Default 4 tyres (full set)
    availableStock: 0,
    action: "add",
  });

  const [customerDetail, setCustomerDetails] = useState({
    customerId: null,
    name: "",
    phone: "",
    vehicleNo: "",
    vehicleModel: "",
    paymentMode: "cash", // 'cash', 'partial', 'account', 'card'
    paymentMethod: "cash", // 'cash' or 'bank'
    bankAccountId: "",
    bankName: "",
    recamount: "",
  });

  const [bankAccounts, setBankAccounts] = useState([]);

  useEffect(() => {
    dispatch(getAllCustomerRecord());
    dispatch(getAllItemRecord());
    dispatch(getAllSalesRecords());
    dispatch(getAllAccRecRecord());
    bankApi.getBankAccounts()
      .then((res) => setBankAccounts(res.data?.accounts || []))
      .catch((err) => console.warn("Failed to load bank accounts:", err));
  }, [dispatch]);

  // Structured Customer options with ID
  const customerOptions = React.useMemo(() => {
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
        id: id,
        label: `${name || "Customer"}${phone ? ` (${phone})` : ""}`,
        name: name || "",
        phone: phone || "",
      };
    });
  }, [rawCustomers, customers]);

  // Find active Khata (Accounts Receivable) record for the selected customer
  const customerKhata = React.useMemo(() => {
    if (!customerDetail.customerId && !customerDetail.name) return null;
    return (accRecRecords || []).find((r) => {
      if (customerDetail.customerId && r.customerId === customerDetail.customerId) return true;
      const targetName = (customerDetail.name || "").trim().toLowerCase();
      if (targetName && targetName !== "walk-in customer") {
        if (r.name && r.name.trim().toLowerCase() === targetName) return true;
        if (r.cname && r.cname.trim().toLowerCase() === targetName) return true;
      }
      return false;
    });
  }, [accRecRecords, customerDetail.customerId, customerDetail.name]);

  // Build structured tyre options for dropdown
  const tyreOptions = React.useMemo(() => {
    if (rawItems && rawItems.length > 0) {
      return rawItems.map((i) => ({
        id: i.id,
        label: `${i.brand ? i.brand + " " : ""}${i.pattern || i.name || "Tyre"} - ${i.size} (Stock: ${i.quantity}) - PKR ${Number(i.price || 0).toLocaleString()}`,
        brand: i.brand || "",
        name: i.pattern || i.name || "",
        size: i.size || "",
        price: Number(i.price || 0),
        quantity: Number(i.quantity || 0),
      }));
    }
    return (stockRows || []).map((r) => ({
      id: r[0],
      label: `${r[1]} ${r[2]} - ${r[3]} (Stock: ${r[9]}) - PKR ${Number(r[8] || 0).toLocaleString()}`,
      brand: r[1],
      name: r[2],
      size: r[3],
      price: Number(r[8] || 0),
      quantity: Number(r[9] || 0),
    }));
  }, [rawItems, stockRows]);

  const handleTyreSelect = (selectedOption) => {
    if (!selectedOption) return;
    const tyreName = `${selectedOption.brand ? selectedOption.brand + " " : ""}${selectedOption.name}`.trim();
    setItem((prev) => ({
      ...prev,
      itemId: selectedOption.id,
      itemName: tyreName,
      size: selectedOption.size,
      price: selectedOption.price,
      availableStock: selectedOption.quantity,
      quantity: prev.quantity || "4",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCheckoutSuccess(false);
    setValidationError("");
    if (!item.itemName || !item.price || !item.quantity) return;

    const dataArray = [item.itemName, item.size, Number(item.price), Number(item.quantity), item.itemId || null];

    if (item.action === "add" || !item.action) {
      dispatch(addSales([dataArray]));
      ClearItem();
    } else if (item.action === "edit") {
      dispatch(editSales(dataArray));
      ClearItem();
    } else if (item.action === "delete") {
      dispatch(deleteSales(dataArray));
      ClearItem();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({ ...prev, [name]: value }));
  };

  const ClearItem = () => {
    setItem({
      itemId: null,
      itemName: "",
      size: "",
      price: "",
      quantity: "4",
      availableStock: 0,
      action: "add",
    });
  };

  // Payment amounts calculation
  const total = Number(totalBill || 0);
  let recAmountCalculated = total;
  let remainingDue = 0;

  if (customerDetail.paymentMode === "cash" || customerDetail.paymentMode === "card") {
    recAmountCalculated = total;
    remainingDue = 0;
  } else if (customerDetail.paymentMode === "account") {
    recAmountCalculated = 0;
    remainingDue = total;
  } else if (customerDetail.paymentMode === "partial") {
    const enteredRec = customerDetail.recamount === "" ? 0 : Number(customerDetail.recamount);
    recAmountCalculated = Math.min(total, Math.max(0, enteredRec));
    remainingDue = Math.max(0, total - recAmountCalculated);
  }

  const handleCheckout = async () => {
    if (saleItem.length === 0 || isSubmitting) return;
    setValidationError("");

    const isCreditSale =
      customerDetail.paymentMode === "account" ||
      customerDetail.paymentMode === "partial" ||
      remainingDue > 0;
    const customerName = String(customerDetail.name || "").trim();

    // If it's a credit or partial payment sale, customer name is strictly required
    if (isCreditSale && !customerName) {
      setValidationError("Customer name is required for Credit / Partial (Khata) sales so the ledger can be tracked.");
      const custSection = document.getElementById("customer-info-section");
      if (custSection) {
        custSection.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    const finalCustomerName = customerName || "Walk-in Customer";

    try {
      setIsSubmitting(true);
      const isBankPayment = customerDetail.paymentMethod === "bank";
      const selectedBank = isBankPayment
        ? bankAccounts.find((b) => String(b.id) === String(customerDetail.bankAccountId))
        : null;

      const salePayload = {
        customerId: customerDetail.customerId || null,
        cname: finalCustomerName,
        phone: String(customerDetail.phone || "").trim(),
        vehicleNo: String(customerDetail.vehicleNo || "").toUpperCase().trim(),
        vehicleModel: String(customerDetail.vehicleModel || "").trim(),
        data: saleItem,
        totalBill: total,
        receivedAmount: recAmountCalculated,
        remainingAmount: remainingDue,
        status: remainingDue > 0 ? (recAmountCalculated > 0 ? "partial" : "account") : (isBankPayment ? "bank" : "cash"),
        paymentMethod: isBankPayment ? "bank" : "cash",
        bankAccountId: isBankPayment && selectedBank ? selectedBank.id : null,
        bankName: isBankPayment && selectedBank ? selectedBank.bankName : "",
      };

      const result = await dispatch(createSales(salePayload));

      if (result.error) {
        throw new Error(result.error.message || "Failed to process sale. Please check server connection.");
      }

      // Refresh inventory, sales history, accounts receivable, and customer list
      dispatch(getAllItemRecord());
      dispatch(getAllSalesRecords());
      dispatch(getAllAccRecRecord());
      dispatch(getAllCustomerRecord());

      setLastReceipt({
        ...salePayload,
        id: result.payload?.id || `INV-${Date.now().toString().slice(-5)}`,
        date: new Date().toLocaleDateString("en-GB"),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });

      setCheckoutSuccess(true);
      setReceiptModalOpen(true);

      // Completely clear the cart and inputs on screen
      dispatch(resetCart());
      ClearItem();
      setCustomerDetails({
        customerId: null,
        name: "",
        phone: "",
        vehicleNo: "",
        vehicleModel: "",
        paymentMode: "cash",
        recamount: "",
      });
    } catch (err) {
      console.error("Sale checkout error:", err);
      setValidationError(err?.message || "An error occurred while completing the sale.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewReceipt = (s) => {
    let items = [];
    try {
      items = Array.isArray(s.data)
        ? s.data
        : typeof s.data === "string"
        ? JSON.parse(s.data || "[]")
        : [];
    } catch {
      items = [];
    }

    setLastReceipt({
      id: s.id,
      cname: s.cname || "Walk-in Customer",
      phone: s.phone || "",
      vehicleNo: s.vehicleNo || "",
      vehicleModel: s.vehicleModel || "",
      data: items,
      totalBill: Number(s.totalBill || 0),
      receivedAmount: Number(s.receivedAmount || 0),
      remainingAmount: Number(s.remainingAmount || 0),
      status: s.status,
      date: s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB") : new Date().toLocaleDateString("en-GB"),
      time: s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
    });
    setReceiptModalOpen(true);
  };

  const isEditing = item.action === "edit";
  const isDeleting = item.action === "delete";
  const isOverStock = item.availableStock > 0 && Number(item.quantity) > item.availableStock;

  // Filter sales history
  const filteredSalesHistory = React.useMemo(() => {
    if (!historySearch.trim()) return salesHistory;
    const q = historySearch.toLowerCase();
    return salesHistory.filter((s) => {
      const cname = String(s.cname || "").toLowerCase();
      const vehNo = String(s.vehicleNo || "").toLowerCase();
      const vehMod = String(s.vehicleModel || "").toLowerCase();
      return cname.includes(q) || vehNo.includes(q) || vehMod.includes(q);
    });
  }, [salesHistory, historySearch]);

  return (
    <Card sx={{ p: 1 }}>
      <CardContent>
        {/* Navigation Tabs */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "rgba(79, 70, 229, 0.1)",
                color: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PointOfSaleRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tyre Sales Terminal & Invoicing
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Vehicle registration, tyre sizing, live inventory deduction, and customer ledger billing (PKR)
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {setRender && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<PublishedWithChangesRoundedIcon />}
                onClick={() => setRender("SalesReturn")}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                  color: "#0284c7",
                  borderColor: "rgba(2, 132, 199, 0.4)",
                  "&:hover": { bgcolor: "rgba(2, 132, 199, 0.08)", borderColor: "#0284c7" },
                }}
              >
                Tyre Return / Exchange
              </Button>
            )}
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              sx={{ bgcolor: "#f1f5f9", borderRadius: 2.5, p: 0.5 }}
            >
              <Tab label="New Tyre Sale" sx={{ fontWeight: 700, borderRadius: 2 }} />
              <Tab
                label={`Invoices History (${salesHistory.length})`}
                sx={{ fontWeight: 700, borderRadius: 2 }}
              />
            </Tabs>
          </Stack>
        </Stack>

        {activeTab === 0 && (
          <>
            {checkoutSuccess && (
              <Alert
                severity="success"
                sx={{ mb: 3, borderRadius: 2.5 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<PrintRoundedIcon />}
                    onClick={() => setReceiptModalOpen(true)}
                  >
                    View Receipt
                  </Button>
                }
              >
                Sale processed successfully! Inventory auto-deducted and cart has been cleared.
              </Alert>
            )}

            {validationError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setValidationError("")}>
                {validationError}
              </Alert>
            )}

            {/* Vehicle & Customer Information Section */}
            <Paper
              id="customer-info-section"
              elevation={0}
              sx={{
                p: 2.5,
                bgcolor: "#f8fafc",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <DirectionsCarRoundedIcon sx={{ color: "#4f46e5", fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                    Customer & Vehicle Information
                  </Typography>
                  {customerKhata && Number(customerKhata.remainingAmount || 0) > 0 && (
                    <Chip
                      icon={<AccountBalanceWalletRoundedIcon fontSize="small" />}
                      label={`Khata Due: PKR ${Number(customerKhata.remainingAmount).toLocaleString()}`}
                      size="small"
                      color="error"
                      sx={{ fontWeight: 800, height: 24, fontSize: "0.75rem" }}
                    />
                  )}
                  {customerKhata && Number(customerKhata.remainingAmount || 0) <= 0 && (
                    <Chip
                      label="Khata: Settled"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700, height: 24, fontSize: "0.75rem" }}
                    />
                  )}
                </Stack>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setCustomerDetails((prev) => ({
                      ...prev,
                      customerId: null,
                      name: "Walk-in Customer",
                      phone: "",
                    }))
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    borderRadius: 2,
                    py: 0.25,
                  }}
                >
                  Quick: Walk-in Customer
                </Button>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={customerOptions}
                    getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
                    value={
                      customerOptions.find((co) => co.id === customerDetail.customerId) ||
                      (customerDetail.name ? customerDetail.name : null)
                    }
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
                      <TextField
                        {...params}
                        required
                        label="Customer Name *"
                        placeholder="Select or enter customer name..."
                        helperText="Required to track customer tyre sales & Khata"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Customer Phone"
                    name="phone"
                    value={customerDetail.phone}
                    onChange={handleCustomerChange}
                    placeholder="e.g. 0300-1234567"
                    helperText="Customer contact number"
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vehicle Plate No. (Optional)"
                    name="vehicleNo"
                    value={customerDetail.vehicleNo}
                    onChange={handleCustomerChange}
                    placeholder="e.g. LEA-2024, ICT-8899"
                    InputProps={{
                      style: { textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" },
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Vehicle Model (Optional)"
                    name="vehicleModel"
                    value={customerDetail.vehicleModel}
                    onChange={handleCustomerChange}
                    placeholder="e.g. Toyota Corolla, Civic"
                  />
                </Grid>

                {customerKhata && Number(customerKhata.remainingAmount || 0) > 0 && (
                  <Grid item xs={12}>
                    <Alert
                      severity="warning"
                      icon={<AccountBalanceWalletRoundedIcon />}
                      sx={{ py: 0.5, px: 2, borderRadius: 2, fontWeight: 600, fontSize: "0.85rem" }}
                    >
                      Customer Khata Balance: <strong>PKR {Number(customerKhata.remainingAmount).toLocaleString()}</strong> due. Any credit balance from this sale will be synced automatically into their Khata ledger.
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>

            {/* Tyre Cart Entry Section */}
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 2.5,
                bgcolor: "#ffffff",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
                  {isEditing ? "Edit Tyre in Cart" : isDeleting ? "Remove Tyre from Cart" : "Select Tyre & Add to Invoice"}
                </Typography>
                {isOverStock && (
                  <Chip
                    label={`Warning: Only ${item.availableStock} tyres in stock!`}
                    color="error"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                )}
              </Stack>

              <Grid container spacing={2} alignItems="center">
                {/* Tyre Selector */}
                <Grid item xs={12} sm={5}>
                  <Autocomplete
                    size="small"
                    options={tyreOptions}
                    getOptionLabel={(option) => option.label || ""}
                    onChange={(e, val) => handleTyreSelect(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Tyre from Inventory"
                        placeholder="Choose tyre model & size..."
                        required={!item.itemName}
                      />
                    )}
                  />
                </Grid>

                {/* Size (Auto filled or manual) */}
                <Grid item xs={12} sm={2.5}>
                  <TextField
                    fullWidth
                    required
                    label="Tyre Size"
                    size="small"
                    name="size"
                    value={item.size}
                    onChange={handleChange}
                    placeholder="e.g. 195/65 R15"
                  />
                </Grid>

                {/* Quantity (Default 4 tyres) */}
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    required
                    label="Quantity"
                    size="small"
                    name="quantity"
                    type="number"
                    value={item.quantity}
                    onChange={handleChange}
                    placeholder="4"
                    helperText={item.availableStock ? `Available: ${item.availableStock}` : ""}
                  />
                </Grid>

                {/* Unit Price */}
                <Grid item xs={12} sm={2.5}>
                  <TextField
                    fullWidth
                    required
                    label="Unit Sale Price (PKR)"
                    size="small"
                    name="price"
                    type="number"
                    value={item.price}
                    onChange={handleChange}
                    placeholder="18500"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                    {isEditing ? (
                      <>
                        <Button type="submit" variant="contained" color="primary" startIcon={<SaveRoundedIcon />}>
                          Update Tyre
                        </Button>
                        <Button variant="outlined" color="inherit" onClick={ClearItem} startIcon={<ClearRoundedIcon />}>
                          Cancel
                        </Button>
                      </>
                    ) : isDeleting ? (
                      <>
                        <Button type="submit" variant="contained" color="error" startIcon={<DeleteRoundedIcon />}>
                          Confirm Remove
                        </Button>
                        <Button variant="outlined" color="inherit" onClick={ClearItem} startIcon={<ClearRoundedIcon />}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<AddShoppingCartRoundedIcon />}
                        sx={{ px: 3, fontWeight: 700 }}
                      >
                        Add to Invoice
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>

            {/* Current Order Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Invoice Items ({saleItem.length})
            </Typography>
            <SalesTable
              data={saleItem}
              header={["Tyre Description", "Size", "Unit Price (PKR)", "Quantity"]}
              setItem={setItem}
            />

            <Divider sx={{ my: 4 }} />

            {/* Checkout Payment Bar */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: "#f8fafc",
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={5}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1 }}>
                      Payment Method & Terms
                    </FormLabel>
                    <RadioGroup
                      row
                      name="paymentMode"
                      value={customerDetail.paymentMode}
                      onChange={handleCustomerChange}
                    >
                      <FormControlLabel value="cash" control={<Radio color="primary" />} label="Full Cash" />
                      <FormControlLabel value="partial" control={<Radio color="primary" />} label="Partial Cash + Khata" />
                      <FormControlLabel value="account" control={<Radio color="primary" />} label="Full Credit (Khata)" />
                      <FormControlLabel value="card" control={<Radio color="primary" />} label="Card" />
                    </RadioGroup>
                  </FormControl>

                  {/* Payment Channel: Cash Drawer vs Bank Account */}
                  {customerDetail.paymentMode !== "account" && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 1 }}>
                        RECEIVE PAYMENT INTO:
                      </Typography>
                      <RadioGroup
                        row
                        value={customerDetail.paymentMethod || "cash"}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomerDetails((prev) => ({
                            ...prev,
                            paymentMethod: val,
                            bankAccountId: val === "bank" ? (prev.bankAccountId || bankAccounts[0]?.id || "") : "",
                            bankName: val === "bank" ? (prev.bankName || bankAccounts[0]?.bankName || "") : "",
                          }));
                        }}
                      >
                        <FormControlLabel value="cash" control={<Radio size="small" />} label="Cash Drawer (Till)" />
                        <FormControlLabel value="bank" control={<Radio size="small" />} label="Shop Bank Account (Online / IBFT)" />
                      </RadioGroup>

                      {customerDetail.paymentMethod === "bank" && (
                        <Box sx={{ mt: 1.5 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Select Shop Bank Account"
                            value={customerDetail.bankAccountId || ""}
                            onChange={(e) => {
                              const bId = e.target.value;
                              const matched = bankAccounts.find((b) => String(b.id) === String(bId));
                              setCustomerDetails((prev) => ({
                                ...prev,
                                bankAccountId: bId,
                                bankName: matched ? matched.bankName : "",
                              }));
                            }}
                            helperText="Customer's payment will be automatically deposited and synced to this bank account"
                          >
                            {bankAccounts.length === 0 ? (
                              <MenuItem value="" disabled>No bank accounts configured</MenuItem>
                            ) : (
                              bankAccounts.map((b) => (
                                <MenuItem key={b.id} value={b.id}>
                                  {b.bankName} - {b.accountNumber} ({b.accountTitle})
                                </MenuItem>
                              ))
                            )}
                          </TextField>
                        </Box>
                      )}
                    </Box>
                  )}

                  {customerDetail.paymentMode === "partial" && (
                    <Box sx={{ mt: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cash Amount Received Now (PKR)"
                        name="recamount"
                        type="number"
                        value={customerDetail.recamount}
                        onChange={handleCustomerChange}
                        placeholder="e.g. 25000"
                        helperText="Enter cash paid by customer. Remaining is added to Khata."
                      />
                    </Box>
                  )}

                  {remainingDue > 0 && (
                    <Alert severity="info" icon={<AccountBalanceWalletRoundedIcon />} sx={{ mt: 2, borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        PKR {remainingDue.toLocaleString()} will automatically be added to {customerDetail.name || "Customer"}'s ledger in Accounts Receivable.
                      </Typography>
                    </Alert>
                  )}
                </Grid>

                <Grid item xs={12} md={7}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={3}
                    justifyContent="flex-end"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice Total
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                        PKR {total.toLocaleString()}
                      </Typography>

                      <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700 }}>
                        Cash Received: PKR {recAmountCalculated.toLocaleString()}
                      </Typography>

                      {remainingDue > 0 && (
                        <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 800 }}>
                          Remaining Khata: PKR {remainingDue.toLocaleString()}
                        </Typography>
                      )}
                    </Box>

                    {validationError && (
                      <Alert
                        severity="error"
                        onClose={() => setValidationError("")}
                        sx={{ py: 0, px: 2, borderRadius: 2, fontSize: "0.85rem", maxWidth: 380 }}
                      >
                        {validationError}
                      </Alert>
                    )}

                    <Button
                      variant="contained"
                      size="large"
                      disabled={saleItem.length === 0 || isSubmitting}
                      onClick={handleCheckout}
                      startIcon={
                        isSubmitting ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <CheckCircleRoundedIcon />
                        )
                      }
                      sx={{
                        px: 3.5,
                        py: 1.4,
                        fontWeight: 700,
                        borderRadius: 2.5,
                        bgcolor: "#10b981",
                        "&:hover": { bgcolor: "#059669" },
                        "&.Mui-disabled": {
                          bgcolor: "#94a3b8",
                          color: "#ffffff",
                        },
                      }}
                    >
                      {isSubmitting ? "Processing..." : "Complete Sale"}
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </>
        )}

        {/* Sales Invoices History View */}
        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="Search invoices by customer name, plate no, or car model..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                sx={{ minWidth: 360 }}
              />
              <Typography variant="body2" color="text.secondary">
                Showing {filteredSalesHistory.length} recorded invoices
              </Typography>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
              <Table size="medium">
                <TableHead sx={{ bgcolor: "#f8fafc" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Tyres & Specifications</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Vehicle Plate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Vehicle Model</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Paid (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remaining (PKR)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gross Profit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSalesHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No invoices found. Complete a sale on the terminal to generate an invoice.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSalesHistory.map((s) => (
                      <TableRow key={s.id} hover>
                        <TableCell sx={{ fontWeight: 700, color: "#4f46e5" }}>
                          INV-{s.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{s.cname || "Walk-in"}</TableCell>

                        {/* Tyres & Specifications: Clean Eye Icon to open Sales Receipt Breakdown */}
                        <TableCell sx={{ minWidth: 150 }}>
                          {(() => {
                            const items = Array.isArray(s.data) ? s.data : JSON.parse(s.data || "[]");
                            const totalUnits = items.reduce(
                              (acc, curr) => acc + Number(curr.quantity || curr.qty || curr[3] || 0),
                              0
                            );

                            return (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label={`${totalUnits || items.length} tyres`}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    bgcolor: "rgba(2, 132, 199, 0.08)",
                                    color: "#0284c7",
                                  }}
                                />
                                <Tooltip title="Click to view Sales Invoice & Tyre Specifications">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewReceipt(s)}
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
                            );
                          })()}
                        </TableCell>

                        <TableCell>
                          {s.vehicleNo ? (
                            <Chip
                              label={s.vehicleNo}
                              size="small"
                              sx={{ fontWeight: 700, bgcolor: "#f1f5f9", fontFamily: "monospace" }}
                            />
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>{s.vehicleModel || "-"}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>PKR {Number(s.totalBill || 0).toLocaleString()}</TableCell>
                        <TableCell sx={{ color: "#10b981", fontWeight: 600 }}>
                          PKR {Number(s.receivedAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: Number(s.remainingAmount || 0) > 0 ? "#ef4444" : "#64748b", fontWeight: 600 }}>
                          PKR {Number(s.remainingAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "#10b981", fontWeight: 700 }}>
                          +PKR {Number(s.profit || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.status || (Number(s.remainingAmount || 0) > 0 ? "Khata" : "Paid")}
                            size="small"
                            color={Number(s.remainingAmount || 0) > 0 ? "warning" : "success"}
                            variant="outlined"
                            sx={{ fontWeight: 700, textTransform: "capitalize" }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PrintRoundedIcon />}
                            onClick={() => handleViewReceipt(s)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              textTransform: "none",
                              py: 0.5,
                            }}
                          >
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Printable Receipt Modal */}
        <Dialog open={receiptModalOpen} onClose={() => setReceiptModalOpen(false)} maxWidth="sm" fullWidth>

          <DialogTitle className="no-print" sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ReceiptLongRoundedIcon sx={{ color: "#4f46e5" }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Tyre Sale Invoice & Receipt
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                size="small"
                onClick={() => window.print()}
                sx={{
                  bgcolor: "#4f46e5",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "#4338ca" },
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  gap: 0.5,
                }}
              >
                <PrintRoundedIcon fontSize="small" />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#fff" }}>
                  Print
                </Typography>
              </IconButton>
              <IconButton size="small" onClick={() => setReceiptModalOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
            {lastReceipt && (
              <Box id="printable-receipt">
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "0.02em" }}>
                    USAMA SAEED TYRE SHOP
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Tyre Sales Receipt
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: "#f8fafc", mb: 2, borderRadius: 2, border: "1px solid", borderColor: "#e2e8f0" }} elevation={0}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Customer / Account:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{lastReceipt.cname || "Walk-in Customer"}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Invoice Date & Time:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{lastReceipt.date} {lastReceipt.time}</Typography>
                    </Grid>
                    {lastReceipt.phone && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Phone Number:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{lastReceipt.phone}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={lastReceipt.phone ? 6 : 6}>
                      <Typography variant="caption" color="text.secondary">Vehicle Plate:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#4f46e5" }}>
                        {lastReceipt.vehicleNo || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Vehicle Model:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {lastReceipt.vehicleModel || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Payment Status:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: lastReceipt.remainingAmount > 0 ? "#ef4444" : "#10b981", textTransform: "capitalize" }}>
                        {lastReceipt.status || (lastReceipt.remainingAmount > 0 ? "Khata" : "Paid")}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Table size="small" sx={{ mb: 1 }}>
                  <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item / Size</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!lastReceipt.data || lastReceipt.data.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 2, color: "text.secondary", fontStyle: "italic" }}>
                          No Items
                        </TableCell>
                      </TableRow>
                    ) : (
                      lastReceipt.data.map((itemRow, idx) => {
                        const isArr = Array.isArray(itemRow);
                        const itemName = isArr ? itemRow[0] : (itemRow.itemName || itemRow.name || "Tyre");
                        const itemSize = isArr ? itemRow[1] : (itemRow.size || "");
                        const itemPrice = Number((isArr ? itemRow[2] : itemRow.price) || 0);
                        const itemQty = Number((isArr ? itemRow[3] : (itemRow.quantity || itemRow.qty)) || 1);
                        const lineTotal = itemPrice * itemQty;

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{itemName}</Typography>
                              {itemSize && (
                                <Typography variant="caption" color="text.secondary">{itemSize}</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">{itemQty}</TableCell>
                            <TableCell align="right">PKR {itemPrice.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              PKR {lineTotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={0.5} sx={{ px: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Total Bill:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>PKR {lastReceipt.totalBill.toLocaleString()}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Cash Received:</Typography>
                    <Typography variant="body2" sx={{ color: "#10b981", fontWeight: 700 }}>
                      PKR {lastReceipt.receivedAmount.toLocaleString()}
                    </Typography>
                  </Stack>
                  {lastReceipt.remainingAmount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Remaining Added to Khata:</Typography>
                      <Typography variant="body2" sx={{ color: "#ef4444", fontWeight: 800 }}>
                        PKR {lastReceipt.remainingAmount.toLocaleString()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
