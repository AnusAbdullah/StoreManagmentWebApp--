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
  InputAdornment,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import TireRepairRoundedIcon from "@mui/icons-material/TireRepairRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import StockTable from "./StockTable";
import { useDispatch, useSelector } from "react-redux";
import {
  createItemRecord,
  getAllItemRecord,
  updateItemRecord,
  deleteItemRecord,
} from "../features/Data/StockSlice";
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

const TYRE_CATEGORIES = [
  "Passenger Car (PCR)",
  "SUV / 4x4",
  "Commercial Van / Light Truck (LTR)",
  "Truck & Bus (TBR)",
  "Motorcycle",
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

export default function StockForm() {
  const dispatch = useDispatch();
  const { header = [], data = [] } = useSelector((state) => state.stock);
  const categoriesList = useSelector((state) => state.category?.data || []);
  const rawItems = useSelector((state) => state.stock?.rawItems || []);
  const [searchValue, setSearchValue] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [item, setItem] = useState({
    brand: "",
    name: "", // Pattern / Model
    pattern: "",
    size: "",
    catagory: "Passenger Car (PCR)",
    origin: "",
    dot: new Date().getFullYear().toString(),
    costPrice: "",
    price: "",
    quantity: "",
  });

  useEffect(() => {
    dispatch(getAllItemRecord());
    dispatch(getAllCategoryRecord());
  }, [dispatch]);

  const categoryOptions = React.useMemo(() => {
    const fromApi = categoriesList.map((c) =>
      Array.isArray(c) ? String(c[1] || "") : String(c.name || "")
    ).filter(Boolean);
    return Array.from(new Set([...TYRE_CATEGORIES, ...fromApi]));
  }, [categoriesList]);

  const brandOptions = React.useMemo(() => {
    const fromInv = (rawItems || []).map((it) => it.brand).filter(Boolean);
    return Array.from(new Set([...TYRE_BRANDS, ...fromInv]));
  }, [rawItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...item,
      name: item.pattern || item.name || `${item.brand} Tyre`,
      costPrice: Number(item.costPrice || 0),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
    };

    if (!item.action) {
      await dispatch(createItemRecord(payload));
      dispatch(getAllItemRecord());
      Clear();
    } else if (item.action === "edit") {
      await dispatch(updateItemRecord(payload));
      dispatch(getAllItemRecord());
      Clear();
    } else if (item.action === "delete") {
      await dispatch(deleteItemRecord(item.id));
      dispatch(getAllItemRecord());
      Clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchValue(value);
    } else {
      setItem({ ...item, [name]: value });
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchValue.trim()) return data;
    const q = searchValue.toLowerCase();
    return data.filter((row) => {
      const brand = String(row[1] || "").toLowerCase();
      const pattern = String(row[2] || "").toLowerCase();
      const size = String(row[3] || "").toLowerCase();
      const cat = String(row[4] || "").toLowerCase();
      const origin = String(row[5] || "").toLowerCase();
      return (
        brand.includes(q) ||
        pattern.includes(q) ||
        size.includes(q) ||
        cat.includes(q) ||
        origin.includes(q)
      );
    });
  }, [data, searchValue]);

  const Clear = () => {
    setItem({
      brand: "",
      name: "",
      pattern: "",
      size: "",
      catagory: "Passenger Car",
      origin: "",
      dot: new Date().getFullYear().toString(),
      costPrice: "",
      price: "",
      quantity: "",
    });
    setSearchValue("");
  };

  const isEditing = item.action === "edit";
  const isDeleting = item.action === "delete";

  // Calculate profit margin helper
  const estimatedCost = Number(item.costPrice || 0);
  const estimatedSale = Number(item.price || 0);
  const estimatedMargin =
    estimatedSale > 0 && estimatedCost > 0
      ? Math.round(((estimatedSale - estimatedCost) / estimatedSale) * 100)
      : null;

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
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: "rgba(16, 185, 129, 0.1)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TireRepairRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Tyre Inventory & Specifications
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage tyre brands, tread patterns, size dimensions, DOT year, origins, and profit margins
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip label={`${data.length} Tyre Specs in Catalog`} color="success" variant="outlined" size="small" />
            <Button
              variant="contained"
              size="small"
              startIcon={<PrintRoundedIcon />}
              onClick={() => setPrintModalOpen(true)}
              sx={{
                bgcolor: "#0284c7",
                color: "#ffffff",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                "&:hover": { bgcolor: "#0369a1" },
              }}
            >
              Print Stock Report
            </Button>
          </Stack>
        </Stack>

        {/* Form Container */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 3,
            bgcolor: "#f8fafc",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: "#334155" }}>
            {isEditing ? "Edit Tyre Stock" : isDeleting ? "Delete Tyre Item" : "Register Tyre in Stock"}
          </Typography>

          <Grid container spacing={2} alignItems="center">
            {/* Tyre Brand */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={brandOptions}
                value={item.brand || ""}
                onChange={(e, val) => setItem({ ...item, brand: val || "" })}
                onInputChange={(e, val) => setItem({ ...item, brand: val || "" })}
                renderInput={(params) => (
                  <TextField {...params} label="Brand (Optional)" placeholder="Select or type brand..." />
                )}
              />
            </Grid>

            {/* Tread Pattern / Model */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                id="pattern"
                label="Model / Pattern (Optional)"
                variant="outlined"
                size="small"
                name="pattern"
                value={item.pattern || item.name || ""}
                onChange={(e) => setItem({ ...item, pattern: e.target.value, name: e.target.value })}
                placeholder="e.g. Primacy 4"
              />
            </Grid>

            {/* Tyre Size */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={TYRE_SIZES}
                value={item.size || ""}
                onChange={(e, val) => setItem({ ...item, size: val || "" })}
                onInputChange={(e, val) => setItem({ ...item, size: val || "" })}
                renderInput={(params) => (
                  <TextField {...params} label="Tyre Size" placeholder="e.g. 195/65 R15" required />
                )}
              />
            </Grid>

            {/* Category / Vehicle Type */}
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                size="small"
                options={categoryOptions}
                value={item.catagory || "Passenger Car"}
                onChange={(e, val) => setItem({ ...item, catagory: val || "Passenger Car" })}
                onInputChange={(e, val) => setItem({ ...item, catagory: val || "Passenger Car" })}
                renderInput={(params) => (
                  <TextField {...params} label="Category / Type (Optional)" placeholder="Select type..." />
                )}
              />
            </Grid>

            {/* Country of Origin */}
            <Grid item xs={12} sm={2.4}>
              <Autocomplete
                freeSolo
                size="small"
                options={ORIGIN_COUNTRIES}
                value={item.origin || ""}
                onChange={(e, val) => setItem({ ...item, origin: val || "" })}
                onInputChange={(e, val) => setItem({ ...item, origin: val || "" })}
                renderInput={(params) => (
                  <TextField {...params} label="Origin (Optional)" placeholder="e.g. Japan" />
                )}
              />
            </Grid>

            {/* DOT / Year */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                id="dot"
                label="DOT / Year (Optional)"
                variant="outlined"
                size="small"
                name="dot"
                value={item.dot}
                onChange={handleChange}
                placeholder="e.g. 2024"
              />
            </Grid>

            {/* Cost Price */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                id="costPrice"
                label="Cost Price (PKR - Optional)"
                variant="outlined"
                size="small"
                name="costPrice"
                type="number"
                value={item.costPrice}
                onChange={handleChange}
                placeholder="e.g. 15000"
              />
            </Grid>

            {/* Selling Price */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                required
                id="price"
                label="Sale Price (PKR)"
                variant="outlined"
                size="small"
                name="price"
                type="number"
                value={item.price}
                onChange={handleChange}
                placeholder="e.g. 19500"
                helperText={
                  estimatedMargin !== null
                    ? `Margin: +${estimatedMargin}%`
                    : ""
                }
              />
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={2.4}>
              <TextField
                fullWidth
                required
                id="quantity"
                label="Stock Quantity"
                variant="outlined"
                size="small"
                name="quantity"
                type="number"
                value={item.quantity}
                onChange={handleChange}
                placeholder="e.g. 24"
              />
            </Grid>

            {/* Actions */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                {isEditing ? (
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      startIcon={<SaveRoundedIcon />}
                    >
                      Save Tyre Changes
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={Clear}
                      startIcon={<ClearRoundedIcon />}
                    >
                      Cancel
                    </Button>
                  </>
                ) : isDeleting ? (
                  <>
                    <Button
                      type="submit"
                      variant="contained"
                      color="error"
                      startIcon={<DeleteRoundedIcon />}
                    >
                      Confirm Delete Tyre
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={Clear}
                      startIcon={<ClearRoundedIcon />}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<AddRoundedIcon />}
                  >
                    Add Tyre to Inventory
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Search Bar & Table Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tyre Catalog & Stock Levels
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              name="search"
              value={searchValue}
              onChange={handleChange}
              placeholder="Search by brand, size, pattern, or origin..."
              sx={{ minWidth: { xs: 200, sm: 320 } }}
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
                borderColor: "#0284c7",
                color: "#0284c7",
                "&:hover": { bgcolor: "rgba(2, 132, 199, 0.08)", borderColor: "#0369a1" },
              }}
            >
              Print Inventory
            </Button>
          </Stack>
        </Stack>

        {/* Stock Catalog Table */}
        <StockTable
          data={filteredData}
          header={header}
          setItem={setItem}
          onPrint={() => setPrintModalOpen(true)}
        />
      </CardContent>

      {/* ─── INVENTORY PRINT MODAL ─── */}
      <Dialog
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Tyre Inventory Stock Report - Print Preview
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, bgcolor: "#0284c7", "&:hover": { bgcolor: "#0369a1" } }}
            >
              Print Now
            </Button>
            <IconButton onClick={() => setPrintModalOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box id="printable-inventory" sx={{ bgcolor: "#ffffff", color: "#000000", p: 2 }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", borderBottom: "2px solid #000", pb: 2, mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, textTransform: "uppercase" }}>
                Usama Saeed Tyre Shop
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                COMPLETE TYRE INVENTORY & STOCK VALUATION REPORT
              </Typography>
              <Typography variant="body2" sx={{ color: "#333", mt: 0.5 }}>
                Report Generated: <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</strong> • Scope: {searchValue ? `Filtered by "${searchValue}" (${filteredData.length} items)` : `Full Catalog (${data.length} items)`}
              </Typography>
            </Box>

            {/* Inventory Valuation KPI Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    TOTAL SPECIFICATIONS
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {filteredData.length} items
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    TOTAL PHYSICAL STOCK
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#0284c7" }}>
                    {filteredData.reduce((acc, row) => acc + Number(row[9] || 0), 0)} Tyres
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#ccc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#666" }}>
                    VALUATION (AT COST)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#dc2626" }}>
                    PKR {filteredData.reduce((acc, row) => acc + (Number(row[9] || 0) * Number(row[7] || 0)), 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={3}>
                <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#000", bgcolor: "#f8fafc", textAlign: "center" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#000" }}>
                    POTENTIAL SALE VALUE
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: "#059669" }}>
                    PKR {filteredData.reduce((acc, row) => acc + (Number(row[9] || 0) * Number(row[8] || 0)), 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Inventory Table */}
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Brand</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Pattern / Model</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Origin</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>DOT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Cost (PKR)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Sale (PKR)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Stock Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Total Value (PKR)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                      No inventory records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((row, idx) => {
                    const cost = Number(row[7] || 0);
                    const sale = Number(row[8] || 0);
                    const qty = Number(row[9] || 0);
                    const val = cost * qty;
                    return (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: "#555" }}>{idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{row[1] || "-"}</TableCell>
                        <TableCell>{row[2] || "-"}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontFamily: "monospace" }}>{row[3] || "-"}</TableCell>
                        <TableCell>{row[4] || "-"}</TableCell>
                        <TableCell>{row[5] || "-"}</TableCell>
                        <TableCell>{row[6] || "-"}</TableCell>
                        <TableCell align="right">PKR {cost.toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>PKR {sale.toLocaleString()}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: qty <= 2 ? "#dc2626" : "#0f172a" }}>
                          {qty}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          PKR {val.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
                {/* Grand Total Row */}
                {filteredData.length > 0 && (
                  <TableRow sx={{ bgcolor: "#f8fafc", borderTop: "2px solid #000" }}>
                    <TableCell colSpan={9} sx={{ fontWeight: 900, textAlign: "right" }}>
                      GRAND TOTALS:
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 900, color: "#0284c7" }}>
                      {filteredData.reduce((acc, row) => acc + Number(row[9] || 0), 0)} Tyres
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "#dc2626" }}>
                      PKR {filteredData.reduce((acc, row) => acc + (Number(row[9] || 0) * Number(row[7] || 0)), 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Signature Area */}
            <Box sx={{ mt: 6, pt: 3, borderTop: "1px dashed #999" }}>
              <Grid container spacing={4}>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Inventory Manager / Stock Keeper
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: "center" }}>
                  <Box sx={{ borderBottom: "1px solid #000", width: 180, mx: "auto", mb: 1 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    Proprietor / General Manager
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
