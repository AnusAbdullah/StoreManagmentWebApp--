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
  Autocomplete,
  Chip,
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import * as bankApi from "../api/BankAccountApi";
import { useDispatch, useSelector } from "react-redux";
import {
  createPurchaseRecord,
  getAllPurchasesRecord,
  deletePurchaseRecord,
} from "../features/Data/PurchaseSlice";
import { getAllItemRecord } from "../features/Data/StockSlice";
import { getAllCompanyRecord } from "../features/Data/CompanySlice";
import { getAllPartyRecord } from "../features/Data/PartiesSlice";
import { getAllCategoryRecord } from "../features/Data/CatagorySlice";

const TYRE_BRANDS = [
  "Michelin",
  "Bridgestone",
  "Continental",
  "Pirelli",
  "Dunlop",
  "Yokohama",
  "Goodyear",
  "Hankook",
  "Kumho",
  "Toyo",
  "Nexen",
  "Sailun",
  "General Tire",
];

const TYRE_SIZES = [
  "175/70 R13",
  "185/65 R14",
  "195/65 R15",
  "205/55 R16",
  "205/60 R16",
  "215/55 R17",
  "215/60 R16",
  "225/45 R17",
  "225/50 R17",
  "225/65 R17",
  "235/55 R18",
  "265/65 R17",
  "265/70 R16",
  "285/60 R18",
];

const ORIGIN_COUNTRIES = [
  "Japan",
  "Germany",
  "Thailand",
  "China",
  "USA",
  "France",
  "Indonesia",
  "South Korea",
  "Malaysia",
];

export default function PurchaseInvoice() {
  const dispatch = useDispatch();
  const companies = useSelector((state) => state.company?.data || []);
  const parties = useSelector((state) => state.party?.data || []);
  const purchases = useSelector((state) => state.purchases?.data || []);
  const categoriesList = useSelector((state) => state.category?.data || []);
  const rawItems = useSelector((state) => state.stock?.rawItems || []);

  const [successMsg, setSuccessMsg] = useState("");
  const [validationError, setValidationError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [supplierDetails, setSupplierDetails] = useState({
    supplierId: null,
    supplierType: "company",
    supplierName: "",
    contact: "",
    invoiceNo: `PINV-${Date.now().toString().slice(-5)}`,
    date: new Date().toISOString().slice(0, 10),
    paid: "",
    paymentMethod: "cash", // "cash" or "bank"
    bankAccountId: "",
    bankName: "",
  });

  const [currentTyre, setCurrentTyre] = useState({
    brand: "Michelin",
    pattern: "",
    size: "195/65 R15",
    origin: "Japan",
    dot: new Date().getFullYear().toString(),
    category: "Passenger Car (PCR)",
    quantity: "20",
    costPrice: "",
    sellingPrice: "",
  });

  const [purchaseItems, setPurchaseItems] = useState([]);

  useEffect(() => {
    dispatch(getAllPurchasesRecord());
    dispatch(getAllCompanyRecord());
    dispatch(getAllPartyRecord());
    dispatch(getAllCategoryRecord());
    dispatch(getAllItemRecord());
    bankApi.getBankAccounts()
      .then((res) => setBankAccounts(res.data?.accounts || []))
      .catch((err) => console.warn("Failed to load bank accounts in purchases:", err));
  }, [dispatch]);

  // Dynamic Category Options from Database Categories Table
  const categoryOptions = React.useMemo(() => {
    const fromApi = (categoriesList || []).map((c) =>
      Array.isArray(c) ? String(c[1] || "") : String(c.name || "")
    ).filter(Boolean);
    const defaults = [
      "Passenger Car (PCR)",
      "SUV / 4x4",
      "Commercial Van / Light Truck (LTR)",
      "Truck & Bus (TBR)",
      "Motorcycle",
    ];
    return Array.from(new Set([...defaults, ...fromApi]));
  }, [categoriesList]);

  // Dynamic Brand Options from Inventory + Previous Purchases + Standard Brands
  const brandOptions = React.useMemo(() => {
    const fromInventory = (rawItems || []).map((it) => it.brand).filter(Boolean);
    const fromPurchases = [];
    (purchases || []).forEach((p) => {
      try {
        const items = Array.isArray(p.items) ? p.items : JSON.parse(p.items || "[]");
        items.forEach((it) => {
          if (it.brand) fromPurchases.push(it.brand);
        });
      } catch {}
    });
    return Array.from(new Set([...TYRE_BRANDS, ...fromInventory, ...fromPurchases]));
  }, [rawItems, purchases]);

  // Combine supplier names from companies and parties with ID and type
  const supplierOptions = React.useMemo(() => {
    const list = [];
    (parties || []).forEach((p) => {
      const id = Array.isArray(p) ? p[0] : p.id;
      const name = Array.isArray(p) ? p[1] : p.name;
      const phone = Array.isArray(p) ? p[2] : p.phone;
      if (name) {
        list.push({
          id,
          label: `${name} (Trading Party${phone ? ` - ${phone}` : ""})`,
          name,
          contact: phone || "",
          type: "party",
        });
      }
    });
    (companies || []).forEach((c) => {
      const id = Array.isArray(c) ? c[0] : c.id;
      const name = Array.isArray(c) ? c[1] : c.name;
      const phone = Array.isArray(c) ? c[2] : c.phone;
      if (name && !list.find((x) => x.name.toLowerCase() === name.toLowerCase())) {
        list.push({
          id,
          label: `${name} (Company / Supplier${phone ? ` - ${phone}` : ""})`,
          name,
          contact: phone || "",
          type: "company",
        });
      }
    });
    return list;
  }, [companies, parties]);

  // Filter purchase shipments history by invoice #, supplier, brand, size, model, date
  const filteredPurchases = React.useMemo(() => {
    if (!historySearch.trim()) return purchases;
    const q = historySearch.toLowerCase().trim();
    return purchases.filter((p) => {
      const invNo = String(p.invoiceNo || "").toLowerCase();
      const supp = String(p.supplierName || "").toLowerCase();
      const date = String(p.date || "").toLowerCase();
      const status = String(p.status || "").toLowerCase();

      let itemsList = [];
      try {
        itemsList = Array.isArray(p.items)
          ? p.items
          : typeof p.items === "string"
          ? JSON.parse(p.items || "[]")
          : [];
      } catch {
        itemsList = [];
      }

      const matchesItem = itemsList.some((item) => {
        const brand = String(item.brand || "").toLowerCase();
        const pattern = String(item.pattern || item.name || "").toLowerCase();
        const size = String(item.size || "").toLowerCase();
        const origin = String(item.origin || "").toLowerCase();
        const dot = String(item.dot || "").toLowerCase();
        return (
          brand.includes(q) ||
          pattern.includes(q) ||
          size.includes(q) ||
          origin.includes(q) ||
          dot.includes(q)
        );
      });

      return (
        invNo.includes(q) ||
        supp.includes(q) ||
        date.includes(q) ||
        status.includes(q) ||
        matchesItem
      );
    });
  }, [purchases, historySearch]);

  const handleAddTyreToInvoice = (e) => {
    e.preventDefault();
    if (!currentTyre.brand || !currentTyre.size || !currentTyre.costPrice || !currentTyre.quantity) {
      return;
    }

    const qty = Number(currentTyre.quantity || 0);
    const cost = Number(currentTyre.costPrice || 0);
    const lineTotal = qty * cost;

    setPurchaseItems([
      ...purchaseItems,
      {
        ...currentTyre,
        quantity: qty,
        costPrice: cost,
        sellingPrice: Number(currentTyre.sellingPrice || (cost * 1.25)),
        lineTotal,
      },
    ]);

    // Reset tyre input
    setCurrentTyre((prev) => ({
      ...prev,
      pattern: "",
      costPrice: "",
      sellingPrice: "",
      quantity: "20",
    }));
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  const totalInvoiceAmount = React.useMemo(() => {
    return purchaseItems.reduce((acc, curr) => acc + (curr.lineTotal || 0), 0);
  }, [purchaseItems]);

  const paidAmount = Number(supplierDetails.paid || totalInvoiceAmount);
  const remainingPayable = Math.max(0, totalInvoiceAmount - paidAmount);

  const handleCompleteStockIn = async () => {
    if (purchaseItems.length === 0) {
      setValidationError("Please add at least one tyre item to the invoice before completing Stock In.");
      return;
    }
    if (!supplierDetails.supplierName || !String(supplierDetails.supplierName).trim()) {
      setValidationError("Please select or type a Supplier / Company name before completing Stock In.");
      return;
    }
    setValidationError("");

    try {
      const isBank = supplierDetails.paymentMethod === "bank";
      const selectedBank = isBank
        ? bankAccounts.find((b) => String(b.id) === String(supplierDetails.bankAccountId))
        : null;

      const payload = {
        supplierId: supplierDetails.supplierId || null,
        supplierType: supplierDetails.supplierType || "company",
        invoiceNo: supplierDetails.invoiceNo,
        date: supplierDetails.date,
        supplierName: String(supplierDetails.supplierName || "").trim(),
        contact: String(supplierDetails.contact || "").trim(),
        items: purchaseItems,
        totalAmount: totalInvoiceAmount,
        paid: paidAmount,
        remaining: remainingPayable,
        status: remainingPayable <= 0 ? "Paid" : "Partial",
        paymentMethod: isBank ? "bank" : "cash",
        bankAccountId: isBank && selectedBank ? selectedBank.id : null,
        bankName: isBank && selectedBank ? selectedBank.bankName : "",
      };

      await dispatch(createPurchaseRecord(payload));
      dispatch(getAllItemRecord()); // Refresh inventory stock immediately!
      dispatch(getAllPurchasesRecord()); // Refresh invoices table immediately!

      setSuccessMsg(
        `Purchase invoice ${supplierDetails.invoiceNo} recorded successfully! Added ${purchaseItems.reduce(
          (a, b) => a + Number(b.quantity || 0),
          0
        )} tyres directly to warehouse inventory.`
      );

      // Reset form
      setPurchaseItems([]);
      setSupplierDetails({
        supplierId: null,
        supplierName: "",
        contact: "",
        invoiceNo: `PINV-${Date.now().toString().slice(-5)}`,
        date: new Date().toISOString().slice(0, 10),
        paid: "",
      });
    } catch (err) {
      console.error("Stock in error:", err);
      setValidationError(err?.message || "Failed to complete Stock In. Please try again.");
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm("Delete this purchase invoice and revert added stock?")) {
      await dispatch(deletePurchaseRecord(id));
      dispatch(getAllItemRecord());
      dispatch(getAllPurchasesRecord());
    }
  };

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "#ffffff",
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2.5,
                bgcolor: "rgba(14, 165, 233, 0.1)",
                color: "#0284c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LocalShippingRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Tyre Purchase Invoice ("Stock In")
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Record incoming shipments from tyre manufacturers / distributors and automatically increase warehouse stock
              </Typography>
            </Box>
          </Stack>
          <Chip label={`${purchases.length} Invoices Recorded`} color="info" variant="outlined" size="small" />
        </Stack>

        {successMsg && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setSuccessMsg("")}>
            {successMsg}
          </Alert>
        )}

        {validationError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2.5 }} onClose={() => setValidationError("")}>
            {validationError}
          </Alert>
        )}

        {/* Supplier & Invoice Header Box */}
        <Paper
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
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <BusinessRoundedIcon sx={{ color: "#0284c7", fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1e293b" }}>
              Supplier / Distributor Details
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                freeSolo
                size="small"
                options={supplierOptions}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.label || "")}
                value={
                  supplierOptions.find((so) => so.id === supplierDetails.supplierId) ||
                  (supplierDetails.supplierName ? supplierDetails.supplierName : null)
                }
                onChange={(e, val) => {
                  if (!val) {
                    setSupplierDetails((prev) => ({ ...prev, supplierId: null, supplierType: "company", supplierName: "", contact: "" }));
                  } else if (typeof val === "string") {
                    setSupplierDetails((prev) => ({ ...prev, supplierId: null, supplierType: "company", supplierName: val }));
                  } else {
                    setSupplierDetails((prev) => ({
                      ...prev,
                      supplierId: val.id,
                      supplierType: val.type || "company",
                      supplierName: val.name,
                      contact: val.contact || prev.contact,
                    }));
                  }
                }}
                onInputChange={(e, val, reason) => {
                  if (reason === "input") {
                    setSupplierDetails((prev) => ({ ...prev, supplierId: null, supplierType: "company", supplierName: val }));
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Supplier / Company Name" placeholder="e.g. Michelin Distributor" required />
                )}
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Supplier Contact / Phone"
                value={supplierDetails.contact}
                onChange={(e) => setSupplierDetails({ ...supplierDetails, contact: e.target.value })}
                placeholder="e.g. 0300-1234567"
              />
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                label="Purchase Invoice #"
                value={supplierDetails.invoiceNo}
                onChange={(e) => setSupplierDetails({ ...supplierDetails, invoiceNo: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={2.5}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Invoice Date"
                value={supplierDetails.date}
                onChange={(e) => setSupplierDetails({ ...supplierDetails, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Incoming Tyre Entry Form */}
        <Box
          component="form"
          onSubmit={handleAddTyreToInvoice}
          sx={{
            p: 2.5,
            bgcolor: "#ffffff",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#334155" }}>
            Add Tyre Items to Purchase Order
          </Typography>

          <Grid container spacing={2} alignItems="center">
            {/* Tyre Brand */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={brandOptions}
                value={currentTyre.brand}
                onChange={(e, val) => setCurrentTyre({ ...currentTyre, brand: val || "" })}
                onInputChange={(e, val) => setCurrentTyre({ ...currentTyre, brand: val || "" })}
                renderInput={(params) => <TextField {...params} label="Tyre Brand" placeholder="Select or type brand..." required />}
              />
            </Grid>

            {/* Tread Pattern / Model */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="Model / Pattern"
                value={currentTyre.pattern}
                onChange={(e) => setCurrentTyre({ ...currentTyre, pattern: e.target.value })}
                placeholder="e.g. Primacy 4, Potenza"
              />
            </Grid>

            {/* Tyre Size */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={TYRE_SIZES}
                value={currentTyre.size}
                onChange={(e, val) => setCurrentTyre({ ...currentTyre, size: val || "" })}
                onInputChange={(e, val) => setCurrentTyre({ ...currentTyre, size: val || "" })}
                renderInput={(params) => <TextField {...params} label="Tyre Size" required />}
              />
            </Grid>

            {/* Vehicle Category */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={categoryOptions}
                value={currentTyre.category || ""}
                onChange={(e, val) => setCurrentTyre({ ...currentTyre, category: val || "" })}
                onInputChange={(e, val) => setCurrentTyre({ ...currentTyre, category: val || "" })}
                renderInput={(params) => <TextField {...params} label="Vehicle Category" placeholder="Select or type..." />}
              />
            </Grid>

            {/* Country of Origin */}
            <Grid item xs={12} sm={2.4}>
              <Autocomplete
                freeSolo
                size="small"
                options={ORIGIN_COUNTRIES}
                value={currentTyre.origin}
                onChange={(e, val) => setCurrentTyre({ ...currentTyre, origin: val || "" })}
                onInputChange={(e, val) => setCurrentTyre({ ...currentTyre, origin: val || "" })}
                renderInput={(params) => <TextField {...params} label="Country of Origin" />}
              />
            </Grid>

            {/* DOT / Year */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                label="DOT / Year"
                value={currentTyre.dot}
                onChange={(e) => setCurrentTyre({ ...currentTyre, dot: e.target.value })}
                placeholder="e.g. 2024"
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label="Quantity (Units)"
                value={currentTyre.quantity}
                onChange={(e) => setCurrentTyre({ ...currentTyre, quantity: e.target.value })}
                placeholder="20"
              />
            </Grid>

            {/* Purchase Cost Price */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label="Cost Price / Unit (PKR)"
                value={currentTyre.costPrice}
                onChange={(e) => setCurrentTyre({ ...currentTyre, costPrice: e.target.value })}
                placeholder="15000"
              />
            </Grid>

            {/* Target Selling Price */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Retail Sale Price (PKR)"
                value={currentTyre.sellingPrice}
                onChange={(e) => setCurrentTyre({ ...currentTyre, sellingPrice: e.target.value })}
                placeholder="19500"
              />
            </Grid>

            {/* Add Button */}
            <Grid item xs={12} sm={2.4}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                startIcon={<AddRoundedIcon />}
                sx={{ py: 1, fontWeight: 700, bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
              >
                Add Item
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Current Purchase Invoice Items Table */}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Shipment Tyre Items ({purchaseItems.length})
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Brand & Model</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Origin</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DOT</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Cost / Unit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Retail Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>
                    No tyres added to shipment yet. Fill the inputs above and click "Add Item".
                  </TableCell>
                </TableRow>
              ) : (
                purchaseItems.map((item, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 700, color: "#0284c7" }}>
                      {item.brand} {item.pattern}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>{item.size}</TableCell>
                    <TableCell>{item.origin || "-"}</TableCell>
                    <TableCell>{item.dot || "-"}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${item.quantity} tyres`} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">PKR {Number(item.costPrice).toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ color: "#10b981", fontWeight: 600 }}>
                      PKR {Number(item.sellingPrice).toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>
                      PKR {Number(item.lineTotal).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Financial Settlement Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: "#f8fafc",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            mb: 4,
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={5}>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Amount Paid to Supplier (PKR)"
                  type="number"
                  value={supplierDetails.paid}
                  onChange={(e) => setSupplierDetails({ ...supplierDetails, paid: e.target.value })}
                  placeholder={totalInvoiceAmount > 0 ? String(totalInvoiceAmount) : "0"}
                />

                {Number(supplierDetails.paid || 0) > 0 && (
                  <Box sx={{ p: 1.5, bgcolor: "#ffffff", borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 0.5 }}>
                      DISBURSE PAYMENT FROM:
                    </Typography>
                    <RadioGroup
                      row
                      value={supplierDetails.paymentMethod || "cash"}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSupplierDetails((prev) => ({
                          ...prev,
                          paymentMethod: val,
                          bankAccountId: val === "bank" ? (prev.bankAccountId || bankAccounts[0]?.id || "") : "",
                          bankName: val === "bank" ? (prev.bankName || bankAccounts[0]?.bankName || "") : "",
                        }));
                      }}
                    >
                      <FormControlLabel value="cash" control={<Radio size="small" />} label="Cash Drawer" />
                      <FormControlLabel value="bank" control={<Radio size="small" />} label="Bank Account / Transfer" />
                    </RadioGroup>

                    {supplierDetails.paymentMethod === "bank" && (
                      <Box sx={{ mt: 1 }}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Select Shop Bank Account"
                          value={supplierDetails.bankAccountId || ""}
                          onChange={(e) => {
                            const bId = e.target.value;
                            const matched = bankAccounts.find((b) => String(b.id) === String(bId));
                            setSupplierDetails((prev) => ({
                              ...prev,
                              bankAccountId: bId,
                              bankName: matched ? matched.bankName : "",
                            }));
                          }}
                          helperText="Payment will be withdrawn automatically from this bank account balance"
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
                      </Box>
                    )}
                  </Box>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6} md={7}>
              <Stack direction="row" spacing={3} justifyContent="flex-end" alignItems="center">
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" color="text.secondary">
                    Total Purchase Shipment
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>
                    PKR {totalInvoiceAmount.toLocaleString()}
                  </Typography>
                  {remainingPayable > 0 && (
                    <Typography variant="caption" sx={{ color: "#ef4444", fontWeight: 700, display: "block" }}>
                      Accounts Payable / Due: PKR {remainingPayable.toLocaleString()}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  disabled={purchaseItems.length === 0 || !supplierDetails.supplierName}
                  onClick={handleCompleteStockIn}
                  startIcon={<CheckCircleRoundedIcon />}
                  sx={{
                    px: 3.5,
                    py: 1.4,
                    fontWeight: 700,
                    borderRadius: 2.5,
                    bgcolor: "#0284c7",
                    "&:hover": { bgcolor: "#0369a1" },
                  }}
                >
                  Receive Stock & Record Invoice
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Divider sx={{ my: 4 }} />

        {/* Purchase History Section */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Recent Purchase Shipments & Stock-In History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {filteredPurchases.length} of {purchases.length} recorded supplier shipments
            </Typography>
          </Box>

          <TextField
            size="small"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Search by invoice #, supplier, tyre brand, size (e.g. 195/65), pattern, or date..."
            sx={{ minWidth: { xs: "100%", sm: 420 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 150, textAlign: "center" }}>Tyres & Specifications</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Bill (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Paid (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payable Due (PKR)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, pr: 2 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {historySearch
                      ? `No purchase invoices match "${historySearch}".`
                      : "No purchase invoices registered yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases.map((p) => {
                  const itemsList = Array.isArray(p.items)
                    ? p.items
                    : typeof p.items === "string"
                    ? JSON.parse(p.items || "[]")
                    : [];
                  const totalUnits = itemsList.reduce((acc, curr) => acc + (Number(curr.quantity || curr.qty || 0)), 0);

                  return (
                    <TableRow key={p.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: "#0284c7" }}>{p.invoiceNo}</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", color: "#64748b" }}>{p.date}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {p.supplierName}
                        {p.contact && (
                          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                            {p.contact}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Tyres & Specifications: Clean Eye Icon to open Buying Details */}
                      <TableCell align="center" sx={{ minWidth: 150 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                          <Chip
                            label={`${totalUnits} tyres`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              bgcolor: "rgba(2, 132, 199, 0.08)",
                              color: "#0284c7",
                            }}
                          />
                          <Tooltip title="Click to view Buying Details & Tyre Specifications">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedInvoice(p);
                                setInvoiceModalOpen(true);
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

                      <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>
                        PKR {Number(p.totalAmount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: "#10b981", fontWeight: 700, whiteSpace: "nowrap" }}>
                        PKR {Number(p.paid || 0).toLocaleString()}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: Number(p.remaining || 0) > 0 ? "#ef4444" : "#64748b",
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        PKR {Number(p.remaining || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={p.status || (Number(p.remaining || 0) > 0 ? "Partial" : "Paid")}
                          size="small"
                          color={Number(p.remaining || 0) > 0 ? "warning" : "success"}
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2 }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Complete Tyre Breakdown">
                            <IconButton
                              size="small"
                              sx={{
                                color: "#0284c7",
                                bgcolor: "rgba(2, 132, 199, 0.08)",
                                "&:hover": { bgcolor: "rgba(2, 132, 199, 0.18)" },
                              }}
                              onClick={() => {
                                setSelectedInvoice(p);
                                setInvoiceModalOpen(true);
                              }}
                            >
                              <VisibilityRoundedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete and revert added stock">
                            <IconButton size="small" color="error" onClick={() => handleDeletePurchase(p.id)}>
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

        {/* ─── FULL PURCHASE INVOICE & TYRES BREAKDOWN DIALOG ─── */}
        <Dialog
          open={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "rgba(2, 132, 199, 0.1)",
                    color: "#0284c7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LocalShippingRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    Purchase Invoice: {selectedInvoice?.invoiceNo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supplier: {selectedInvoice?.supplierName} {selectedInvoice?.contact ? `(${selectedInvoice.contact})` : ""} • Date: {selectedInvoice?.date}
                  </Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setInvoiceModalOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Box id="printable-purchase-invoice" sx={{ bgcolor: "#ffffff", color: "#000000", p: { xs: 1, sm: 2 } }}>
              {/* Printable Header */}
              <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                  Usama Saeed Tyre Shop
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  STOCK PURCHASE INVOICE & GOODS RECEIVED NOTE (GRN)
                </Typography>
                <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                  Invoice #: <strong>{selectedInvoice?.invoiceNo}</strong> • Date: <strong>{selectedInvoice?.date || (selectedInvoice?.createdAt ? new Date(selectedInvoice.createdAt).toLocaleDateString() : "-")}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: "#333" }}>
                  Supplier / Vendor: <strong>{selectedInvoice?.supplierName}</strong> {selectedInvoice?.contact ? `(Tel: ${selectedInvoice.contact})` : ""} {selectedInvoice?.supplierType ? `• Type: ${selectedInvoice.supplierType}` : ""}
                </Typography>
              </Box>

              {/* Financial Summary */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                      TOTAL BILL
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      PKR {Number(selectedInvoice?.totalAmount || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                      PAID TO SUPPLIER
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#059669" }}>
                      PKR {Number(selectedInvoice?.paid || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={4}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                      REMAINING DUE (KHATA)
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: Number(selectedInvoice?.remaining || 0) > 0 ? "#dc2626" : "#0f172a" }}>
                      PKR {Number(selectedInvoice?.remaining || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, borderBottom: "1px solid #ccc", pb: 0.5 }}>
                Received Tyres Itemization:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ border: "1px solid #ccc", mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#eee" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Brand & Pattern</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Origin & DOT</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Cost Price (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal (PKR)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(() => {
                      const list = Array.isArray(selectedInvoice?.items)
                        ? selectedInvoice.items
                        : typeof selectedInvoice?.items === "string"
                        ? JSON.parse(selectedInvoice.items || "[]")
                        : [];

                      return list.map((item, idx) => {
                        const qty = Number(item.quantity || item.qty || 0);
                        const cost = Number(item.costPrice || item.price || 0);
                        const subtotal = qty * cost;

                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              {item.brand} {item.pattern || item.name || ""}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{item.size}</TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>{item.category || "Passenger Car"}</TableCell>
                            <TableCell sx={{ fontSize: "0.85rem" }}>
                              {item.origin || "-"} {item.dot ? `(${item.dot})` : ""}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700 }}>{qty} tyres</TableCell>
                            <TableCell align="right">PKR {cost.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: "#0f172a" }}>
                              PKR {subtotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Signature Area */}
              <Box sx={{ mt: 5, pt: 2, borderTop: "1px dashed #999" }}>
                <Grid container spacing={4}>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Goods Received By (Storekeeper)
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Authorized Signatory / Manager
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="outlined"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Print Invoice
            </Button>
            <Button
              variant="contained"
              onClick={() => setInvoiceModalOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2, px: 3, bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
