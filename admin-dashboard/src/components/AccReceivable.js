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
  Autocomplete,
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
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import * as bankApi from "../api/BankAccountApi";

import { useDispatch, useSelector } from "react-redux";
import {
  getAllAccRecRecord,
  createAccRecRecord,
  updateAccRecRecord,
  deleteAccRecRecord,
} from "../features/Data/AccSlice";
import { getAllCustomerRecord } from "../features/Data/CustomerSlice";
import { getAllCompanyRecord } from "../features/Data/CompanySlice";
import { getAllSalesRecords } from "../features/Data/SalesSlice";
import { getAllPurchasesRecord } from "../features/Data/PurchaseSlice";
import * as accPayApi from "../api/AccPayableApi";

export default function AccReceivable() {
  const dispatch = useDispatch();

  // Active Tab: 0 = Customers (Receivable / Khata), 1 = Companies & Suppliers (Payable)
  const [activeTab, setActiveTab] = useState(0);

  // Redux state
  const rawRecords = useSelector((state) => state.accRec?.rawRecords || []);
  const customers = useSelector((state) => state.customer?.data || []);
  const companies = useSelector((state) => state.company?.data || []);
  const salesHistory = useSelector((state) => state.sale?.salesHistory || []);
  const purchasesData = useSelector((state) => state.purchases?.data || []);

  // Accounts Payable state (Companies & Suppliers)
  const [payRecords, setPayRecords] = useState([]);

  // Bill Receipt Modal State
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form State
  const [searchValue, setSearchValue] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [cname, setCname] = useState("");
  const [currentBalance, setCurrentBalance] = useState(0);
  const [receivedPrior, setReceivedPrior] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash"); // "cash" or "bank"
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState([]);

  // History Modal State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null); // { type: 'customer' | 'company', record }

  // Load Initial Data
  const loadPayables = async () => {
    try {
      const { data } = await accPayApi.getAccPay();
      setPayRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading accounts payable:", err);
    }
  };

  useEffect(() => {
    dispatch(getAllAccRecRecord());
    dispatch(getAllCustomerRecord());
    dispatch(getAllCompanyRecord());
    dispatch(getAllSalesRecords());
    dispatch(getAllPurchasesRecord());
    loadPayables();
    bankApi.getBankAccounts()
      .then((res) => setBankAccounts(res.data?.accounts || []))
      .catch((err) => console.warn("Failed to load bank accounts in Khata:", err));
  }, [dispatch]);

  // Options for Autocomplete
  const customerOptions = useMemo(() => {
    const listFromCustomers = customers
      .map((c) => (Array.isArray(c) ? String(c[1] || "") : String(c.name || "")))
      .filter(Boolean);
    const listFromKhata = rawRecords.map((r) => r.cname).filter(Boolean);
    return Array.from(new Set([...listFromCustomers, ...listFromKhata]));
  }, [customers, rawRecords]);

  const companyOptions = useMemo(() => {
    const listFromCompanies = companies
      .map((c) => (Array.isArray(c) ? String(c[1] || "") : String(c.companyName || c.name || "")))
      .filter(Boolean);
    const listFromKhata = payRecords.map((r) => r.supplierName).filter(Boolean);
    return Array.from(new Set([...listFromCompanies, ...listFromKhata]));
  }, [companies, payRecords]);

  // When active tab changes, reset form
  const handleTabChange = (event, newTab) => {
    setActiveTab(newTab);
    Clear();
    setSearchValue("");
    setSuccessMsg("");
    setErrorMsg("");
  };

  // Selection Handler
  const handleNameSelect = (nameVal) => {
    setCname(nameVal || "");
    const trimmed = (nameVal || "").toLowerCase().trim();

    if (activeTab === 0) {
      // Customer
      const match = rawRecords.find(
        (r) => (r.cname || "").toLowerCase().trim() === trimmed
      );
      if (match) {
        setSelectedRecordId(match.id);
        setCurrentBalance(Number(match.remainingAmount || 0));
        setReceivedPrior(Number(match.receivedTillNow || 0));
      } else {
        setSelectedRecordId(null);
        setCurrentBalance(0);
        setReceivedPrior(0);
      }
    } else {
      // Company / Supplier
      const match = payRecords.find(
        (r) => (r.supplierName || "").toLowerCase().trim() === trimmed
      );
      if (match) {
        setSelectedRecordId(match.id);
        setCurrentBalance(Number(match.remainingAmount || 0));
        setReceivedPrior(Number(match.paidTillNow || 0));
      } else {
        setSelectedRecordId(null);
        setCurrentBalance(0);
        setReceivedPrior(0);
      }
    }
    setPaymentAmount("");
  };

  const handleSelectFromRow = (r) => {
    setSelectedRecordId(r.id);
    setCname(activeTab === 0 ? r.cname || "" : r.supplierName || "");
    setCurrentBalance(Number(r.remainingAmount || 0));
    setReceivedPrior(Number(activeTab === 0 ? r.receivedTillNow || 0 : r.paidTillNow || 0));
    setPaymentAmount("");
    setSuccessMsg("");
    setErrorMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paymentNum = Number(paymentAmount || 0);
  const isExisting = selectedRecordId !== null;
  const calculatedNewBalance = isExisting
    ? Math.max(0, currentBalance - paymentNum)
    : Math.max(0, paymentNum);

  // Submit Handler (Post Payment / Create Khata)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cname.trim()) {
      setErrorMsg("Please specify a valid name.");
      return;
    }
    setErrorMsg("");

    try {
      if (activeTab === 0) {
        // Customer Accounts Receivable
        if (isExisting) {
          const match = rawRecords.find((r) => r.id === selectedRecordId);
          let historyList = [];
          try {
            historyList = Array.isArray(match?.data)
              ? [...match.data]
              : typeof match?.data === "string"
              ? JSON.parse(match?.data || "[]")
              : match?.data && typeof match?.data === "object"
              ? [match.data]
              : [];
          } catch {
            historyList = [];
          }

          // Append recovery transaction to history
          const isBank = paymentMethod === "bank";
          const selectedBank = isBank
            ? bankAccounts.find((b) => String(b.id) === String(bankAccountId))
            : null;

          historyList.push({
            date: new Date().toISOString(),
            type: isBank ? "Bank Recovery" : "Cash Recovery",
            paymentMethod: isBank ? "bank" : "cash",
            bankAccountId: isBank && selectedBank ? selectedBank.id : null,
            bankName: isBank && selectedBank ? selectedBank.bankName : "",
            note: note || (isBank ? `Bank transfer into ${selectedBank?.bankName || "Bank"}` : "Cash payment recovery received at shop counter"),
            receivedToday: paymentNum,
            remainingAmount: calculatedNewBalance,
            totalBill: 0,
          });

          const newReceivedTillNow = receivedPrior + paymentNum;
          await dispatch(
            updateAccRecRecord({
              id: selectedRecordId,
              cname: cname.trim(),
              receivedTillNow: newReceivedTillNow,
              receiveToday: paymentNum,
              remainingAmount: calculatedNewBalance,
              data: historyList,
              paymentMethod: isBank ? "bank" : "cash",
              bankAccountId: isBank && selectedBank ? selectedBank.id : null,
              bankName: isBank && selectedBank ? selectedBank.bankName : "",
              note: note || (isBank ? `Bank transfer into ${selectedBank?.bankName || "Bank"}` : ""),
            })
          );
          setSuccessMsg(
            `Payment of PKR ${paymentNum.toLocaleString()} recorded for customer ${cname}${isBank ? ` via ${selectedBank?.bankName || "Bank"}` : ""}. Remaining balance: PKR ${calculatedNewBalance.toLocaleString()}`
          );
        } else {
          // New Customer Khata
          const historyList = [
            {
              date: new Date().toISOString(),
              type: "Initial Opening Balance",
              note: note || "Opening ledger balance",
              receivedToday: 0,
              remainingAmount: calculatedNewBalance,
              totalBill: calculatedNewBalance,
            },
          ];

          await dispatch(
            createAccRecRecord({
              cname: cname.trim(),
              receivedTillNow: 0,
              receiveToday: 0,
              remainingAmount: calculatedNewBalance,
              data: historyList,
            })
          );
          setSuccessMsg(
            `Customer Khata record created for ${cname} with balance PKR ${calculatedNewBalance.toLocaleString()}`
          );
        }
        dispatch(getAllAccRecRecord());
      } else {
        // Company / Supplier Accounts Payable
        if (isExisting) {
          const match = payRecords.find((r) => r.id === selectedRecordId);
          let historyList = [];
          try {
            historyList = Array.isArray(match?.data)
              ? [...match.data]
              : typeof match?.data === "string"
              ? JSON.parse(match?.data || "[]")
              : match?.data && typeof match?.data === "object"
              ? [match.data]
              : [];
          } catch {
            historyList = [];
          }

          // Append payment made to company
          const isBank = paymentMethod === "bank";
          const selectedBank = isBank
            ? bankAccounts.find((b) => String(b.id) === String(bankAccountId))
            : null;

          historyList.push({
            date: new Date().toISOString(),
            type: isBank ? "Bank Payment to Supplier" : "Payment to Supplier",
            paymentMethod: isBank ? "bank" : "cash",
            bankAccountId: isBank && selectedBank ? selectedBank.id : null,
            bankName: isBank && selectedBank ? selectedBank.bankName : "",
            note: note || (isBank ? `Paid via ${selectedBank?.bankName || "Bank"} transfer` : "Cash payment made to company / supplier"),
            paidToday: paymentNum,
            remainingAmount: calculatedNewBalance,
            totalAmount: 0,
          });

          const newPaidTillNow = receivedPrior + paymentNum;
          await accPayApi.editAccPay(selectedRecordId, {
            supplierName: cname.trim(),
            paidTillNow: newPaidTillNow,
            paidToday: paymentNum,
            remainingAmount: calculatedNewBalance,
            data: historyList,
            paymentMethod: isBank ? "bank" : "cash",
            bankAccountId: isBank && selectedBank ? selectedBank.id : null,
            bankName: isBank && selectedBank ? selectedBank.bankName : "",
            note: note || (isBank ? `Paid via ${selectedBank?.bankName || "Bank"} transfer` : ""),
          });
          setSuccessMsg(
            `Payment of PKR ${paymentNum.toLocaleString()} paid to ${cname}${isBank ? ` from ${selectedBank?.bankName || "Bank"}` : ""}. Remaining payable: PKR ${calculatedNewBalance.toLocaleString()}`
          );
        } else {
          // New Company Payable
          const historyList = [
            {
              date: new Date().toISOString(),
              type: "Initial Opening Balance",
              note: note || "Opening payable balance",
              paidToday: 0,
              remainingAmount: calculatedNewBalance,
              totalAmount: calculatedNewBalance,
            },
          ];

          await accPayApi.createAccPay({
            supplierName: cname.trim(),
            paidTillNow: 0,
            paidToday: 0,
            remainingAmount: calculatedNewBalance,
            data: historyList,
          });
          setSuccessMsg(
            `Company Payable record created for ${cname} with balance PKR ${calculatedNewBalance.toLocaleString()}`
          );
        }
        loadPayables();
      }

      Clear();
    } catch (err) {
      console.error("Khata save error:", err);
      setErrorMsg(err?.message || "Failed to save record.");
    }
  };

  const handleDelete = async (id) => {
    const targetLabel = activeTab === 0 ? "customer" : "company";
    if (window.confirm(`Are you sure you want to delete this ${targetLabel} ledger record?`)) {
      try {
        if (activeTab === 0) {
          await dispatch(deleteAccRecRecord(id));
          dispatch(getAllAccRecRecord());
        } else {
          await accPayApi.deleteAccPay(id);
          loadPayables();
        }
        if (selectedRecordId === id) Clear();
      } catch (err) {
        console.error("Delete error:", err);
        setErrorMsg("Failed to delete record.");
      }
    }
  };

  const Clear = () => {
    setSelectedRecordId(null);
    setCname("");
    setCurrentBalance(0);
    setReceivedPrior(0);
    setPaymentAmount("");
    setNote("");
    setPaymentMethod("cash");
    setBankAccountId("");
  };

  // Open History Ledger Modal
  const handleOpenHistory = (record, type) => {
    setHistoryTarget({ record, type });
    setHistoryOpen(true);
  };

  // Filtered lists
  const filteredCustomerRecords = useMemo(() => {
    if (!searchValue.trim()) return rawRecords;
    const q = searchValue.toLowerCase();
    return rawRecords.filter((r) => {
      const name = String(r.cname || "").toLowerCase();
      const rem = String(r.remainingAmount || "");
      return name.includes(q) || rem.includes(q);
    });
  }, [rawRecords, searchValue]);

  const filteredCompanyRecords = useMemo(() => {
    if (!searchValue.trim()) return payRecords;
    const q = searchValue.toLowerCase();
    return payRecords.filter((r) => {
      const name = String(r.supplierName || "").toLowerCase();
      const rem = String(r.remainingAmount || "");
      return name.includes(q) || rem.includes(q);
    });
  }, [payRecords, searchValue]);

  // Helper to parse and normalize sold tyre items
  const normalizeSaleItems = (dataList) => {
    if (!dataList) return [];
    const list = Array.isArray(dataList)
      ? dataList
      : typeof dataList === "string"
      ? JSON.parse(dataList || "[]")
      : [dataList];

    return list
      .map((row, i) => {
        if (Array.isArray(row)) {
          return {
            id: i + 1,
            name: row[0] || "Tyre Item",
            size: String(row[1] || ""),
            price: Number(row[2] || 0),
            qty: Number(row[3] || 1),
            subtotal: Number(row[2] || 0) * Number(row[3] || 1),
          };
        } else if (typeof row === "object" && row !== null) {
          const name = row.itemName || row.name || row.brand || "Tyre Item";
          const size = String(row.size || "");
          const price = Number(row.price || row.costPrice || 0);
          const qty = Number(row.quantity || row.qty || 1);
          return {
            id: i + 1,
            name,
            size,
            price,
            qty,
            subtotal: price * qty,
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  // Helper to parse and normalize purchase tyre items
  const normalizePurchaseItems = (dataList) => {
    if (!dataList) return [];
    const list = Array.isArray(dataList)
      ? dataList
      : typeof dataList === "string"
      ? JSON.parse(dataList || "[]")
      : [dataList];

    return list.map((item, i) => {
      const brand = item.brand || item.name || "Tyre";
      const pattern = item.pattern || "";
      const size = item.size || "";
      const origin = item.origin || "";
      const dot = item.dot ? `DOT ${item.dot}` : "";
      const category = item.category || "Passenger Car";
      const qty = Number(item.quantity || item.qty || 1);
      const cost = Number(item.costPrice || item.price || 0);
      return {
        id: i + 1,
        brand,
        pattern,
        size,
        origin,
        dot,
        category,
        qty,
        cost,
        subtotal: qty * cost,
      };
    });
  };

  // Open Detailed Bill / Receipt Dialog
  const handleOpenReceipt = (entry) => {
    const isCustomer = historyTarget?.type === "customer";
    const billDetails = {
      type: historyTarget?.type,
      ref:
        entry.ref !== "-"
          ? entry.ref
          : isCustomer
          ? `INV-KHATA-${entry.id}`
          : `PINV-KHATA-${entry.id}`,
      date: entry.date,
      time: entry.time,
      entityName: isCustomer
        ? historyTarget?.record?.cname || entry.matchedSale?.cname || "Customer"
        : historyTarget?.record?.supplierName || entry.matchedPurchase?.supplierName || "Supplier",
      contact: isCustomer
        ? entry.matchedSale?.phone || entry.phone || ""
        : entry.matchedPurchase?.contact || "",
      vehicleNo: entry.vehicleNo || entry.matchedSale?.vehicleNo || "",
      vehicleModel: entry.vehicleModel || entry.matchedSale?.vehicleModel || "",
      status: entry.rem > 0 ? "Khata Due" : "Settled",
      totalBill: entry.bill > 0 ? entry.bill : entry.paid + entry.rem,
      paid: entry.paid,
      rem: entry.rem,
      remarks: entry.remarks,
      items: isCustomer ? entry.saleItems : entry.purchaseItems,
    };
    setSelectedBill(billDetails);
    setBillModalOpen(true);
  };

  // Parse History entries for modal
  const parsedHistoryEntries = useMemo(() => {
    if (!historyTarget?.record) return [];
    const r = historyTarget.record;
    let list = [];

    try {
      if (Array.isArray(r.data)) {
        list = r.data;
      } else if (typeof r.data === "string") {
        const parsed = JSON.parse(r.data || "[]");
        list = Array.isArray(parsed) ? parsed : [parsed];
      } else if (r.data && typeof r.data === "object") {
        list = [r.data];
      }
    } catch {
      list = [];
    }

    // Normalize each entry for display
    return list.map((item, idx) => {
      const dateVal = item.date
        ? new Date(item.date).toLocaleDateString("en-GB")
        : r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("en-GB")
        : "-";

      const timeVal =
        item.date && !isNaN(new Date(item.date).getTime())
          ? new Date(item.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "";

      const ref =
        item.invoiceNo ||
        (item.invoiceId ? `INV-${item.invoiceId}` : "") ||
        (item.purchaseId ? `PINV-${item.purchaseId}` : "") ||
        "-";

      const type =
        item.type ||
        (item.invoiceId ? "Credit Sale Invoice" : "") ||
        (item.purchaseId ? "Stock Purchase Invoice" : "") ||
        (item.receivedToday || item.paidToday ? "Payment Settlement" : "Ledger Entry");

      const vehicle = item.vehicleNo
        ? `${item.vehicleNo}${item.vehicleModel ? ` (${item.vehicleModel})` : ""}`
        : "";

      const bill = Number(item.totalBill || item.totalAmount || 0);
      const paid = Number(item.receivedToday !== undefined ? item.receivedToday : item.paidToday || 0);
      const rem = Number(item.remainingAmount !== undefined ? item.remainingAmount : item.remaining || 0);
      const remarks = item.note || item.remarks || "";

      // Extract raw items
      let rawItems = [];
      if (Array.isArray(item.items)) {
        rawItems = item.items;
      } else if (typeof item.items === "string") {
        try {
          rawItems = JSON.parse(item.items);
        } catch {
          rawItems = [];
        }
      } else if (Array.isArray(item.data)) {
        rawItems = item.data;
      } else if (typeof item.data === "string") {
        try {
          rawItems = JSON.parse(item.data);
        } catch {
          rawItems = [];
        }
      }

      // Customer Sale Matching
      let matchedSale = null;
      if (historyTarget.type === "customer") {
        if (item.invoiceId) {
          matchedSale = salesHistory.find(
            (s) => s.id === item.invoiceId || s.id === Number(item.invoiceId)
          );
        }
        if (!matchedSale && (r.cname || r.customerId) && bill > 0) {
          matchedSale = salesHistory.find((s) => {
            const sDate = (s.date || s.createdAt || "").slice(0, 10);
            const iDate = (item.date || r.createdAt || "").slice(0, 10);
            return (
              (s.cname === r.cname || (r.customerId && s.customerId === r.customerId)) &&
              (sDate === iDate || Number(s.totalBill) === bill)
            );
          });
        }
        if (matchedSale && rawItems.length === 0) {
          rawItems = Array.isArray(matchedSale.data)
            ? matchedSale.data
            : typeof matchedSale.data === "string"
            ? JSON.parse(matchedSale.data || "[]")
            : [];
        }
      }

      // Company / Supplier Purchase Matching
      let matchedPurchase = null;
      if (historyTarget.type === "company") {
        if (item.purchaseId) {
          matchedPurchase = purchasesData.find(
            (p) => p.id === item.purchaseId || p.id === Number(item.purchaseId)
          );
        }
        if (!matchedPurchase && item.invoiceNo) {
          matchedPurchase = purchasesData.find((p) => p.invoiceNo === item.invoiceNo);
        }
        if (!matchedPurchase && (r.supplierName || r.supplierId) && bill > 0) {
          matchedPurchase = purchasesData.find((p) => {
            return (
              (p.supplierName === r.supplierName ||
                (r.supplierId && p.supplierId === r.supplierId)) &&
              Number(p.totalAmount) === bill
            );
          });
        }
        if (matchedPurchase && rawItems.length === 0) {
          rawItems = Array.isArray(matchedPurchase.items)
            ? matchedPurchase.items
            : typeof matchedPurchase.items === "string"
            ? JSON.parse(matchedPurchase.items || "[]")
            : [];
        }
      }

      const saleItems = historyTarget.type === "customer" ? normalizeSaleItems(rawItems) : [];
      const purchaseItems =
        historyTarget.type === "company" ? normalizePurchaseItems(rawItems) : [];
      const hasBill = Boolean(
        (historyTarget.type === "customer" && (saleItems.length > 0 || matchedSale || bill > 0)) ||
          (historyTarget.type === "company" && (purchaseItems.length > 0 || matchedPurchase || bill > 0))
      );

      return {
        id: idx + 1,
        date: dateVal,
        time: timeVal,
        ref,
        type,
        vehicle,
        vehicleNo: item.vehicleNo || matchedSale?.vehicleNo || "",
        vehicleModel: item.vehicleModel || matchedSale?.vehicleModel || "",
        phone: item.phone || matchedSale?.phone || "",
        remarks,
        bill,
        paid,
        rem,
        saleItems,
        purchaseItems,
        matchedSale,
        matchedPurchase,
        hasBill,
      };
    });
  }, [historyTarget, salesHistory, purchasesData]);

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
                bgcolor: activeTab === 0 ? "rgba(244, 63, 94, 0.1)" : "rgba(79, 70, 229, 0.1)",
                color: activeTab === 0 ? "#f43f5e" : "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AccountBalanceWalletRoundedIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Accounts & Khata Ledger System
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Track full transaction history, recovery, and ledger balances for Customers and Companies (PKR)
              </Typography>
            </Box>
          </Stack>

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              bgcolor: "#f1f5f9",
              borderRadius: 3,
              p: 0.5,
              "& .MuiTabs-indicator": {
                bgcolor: activeTab === 0 ? "#f43f5e" : "#4f46e5",
                height: 3,
                borderRadius: 2,
              },
            }}
          >
            <Tab
              icon={<PersonRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`Customers Khata (${rawRecords.length})`}
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: 2.5,
                textTransform: "none",
                minHeight: 40,
                color: activeTab === 0 ? "#f43f5e" : "text.secondary",
                "&.Mui-selected": { color: "#f43f5e" },
              }}
            />
            <Tab
              icon={<BusinessRoundedIcon fontSize="small" />}
              iconPosition="start"
              label={`Companies / Suppliers Khata (${payRecords.length})`}
              sx={{
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: 2.5,
                textTransform: "none",
                minHeight: 40,
                color: activeTab === 1 ? "#4f46e5" : "text.secondary",
                "&.Mui-selected": { color: "#4f46e5" },
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

        {/* Ledger Payment / Balance Entry Form */}
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
              {isExisting
                ? activeTab === 0
                  ? `Record Cash Recovery from Customer: ${cname}`
                  : `Record Payment Paid to Company / Supplier: ${cname}`
                : activeTab === 0
                ? "Add / Open New Customer Khata Balance"
                : "Add / Open New Company Payable Balance"}
            </Typography>

            {isExisting && (
              <Chip
                label={`Current Balance: PKR ${currentBalance.toLocaleString()}`}
                color={activeTab === 0 ? "error" : "primary"}
                size="small"
                sx={{ fontWeight: 800 }}
              />
            )}
          </Stack>

          <Grid container spacing={2} alignItems="center">
            {/* Account / Entity Name */}
            <Grid item xs={12} sm={4}>
              <Autocomplete
                freeSolo
                size="small"
                options={activeTab === 0 ? customerOptions : companyOptions}
                value={cname}
                onChange={(e, val) => handleNameSelect(val)}
                onInputChange={(e, val) => handleNameSelect(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={activeTab === 0 ? "Customer Name" : "Company / Supplier Name"}
                    placeholder={activeTab === 0 ? "Select or type customer..." : "Select or type company..."}
                    required
                  />
                )}
              />
            </Grid>

            {/* Payment / Recovery Amount */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                size="small"
                type="number"
                label={
                  isExisting
                    ? activeTab === 0
                      ? "Cash Recovery Amount (PKR)"
                      : "Cash Payment Paid (PKR)"
                    : "Opening Balance Amount (PKR)"
                }
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="e.g. 25000"
                helperText={
                  isExisting && paymentAmount !== ""
                    ? `Remaining Balance After: PKR ${calculatedNewBalance.toLocaleString()}`
                    : ""
                }
              />
            </Grid>

            {/* Notes / Remarks */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Remarks / Reference Note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={activeTab === 0 ? "e.g. Paid cash at counter" : "e.g. Bank transfer / Cash voucher"}
              />
            </Grid>

            {/* Payment Method Selector (When paying or recovering existing Khata) */}
            {isExisting && (
              <Grid item xs={12}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    bgcolor: "#ffffff",
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155", display: "block", mb: 0.5 }}>
                        {activeTab === 0 ? "RECEIVE RECOVERY INTO:" : "DISBURSE PAYMENT FROM:"}
                      </Typography>
                      <RadioGroup
                        row
                        value={paymentMethod}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPaymentMethod(val);
                          if (val === "bank") {
                            const firstAcc = bankAccounts[0];
                            if (firstAcc) {
                              setBankAccountId(firstAcc.id);
                            }
                          } else {
                            setBankAccountId("");
                          }
                        }}
                      >
                        <FormControlLabel value="cash" control={<Radio size="small" />} label="Counter Drawer Cash" />
                        <FormControlLabel value="bank" control={<Radio size="small" />} label="Shop Bank Account (Online / IBFT)" />
                      </RadioGroup>
                    </Grid>

                    {paymentMethod === "bank" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Select Shop Bank Account"
                          value={bankAccountId || ""}
                          onChange={(e) => {
                            setBankAccountId(e.target.value);
                          }}
                          helperText={
                            activeTab === 0
                              ? "Deposit will be synced to this bank account automatically"
                              : "Withdrawal will be synced to this bank account automatically"
                          }
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
            )}

            {/* Form Buttons */}
            <Grid item xs={12}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isExisting ? <PaymentsRoundedIcon /> : <AddRoundedIcon />}
                  sx={{
                    fontWeight: 700,
                    px: 3,
                    bgcolor: activeTab === 0 ? "#f43f5e" : "#4f46e5",
                    "&:hover": {
                      bgcolor: activeTab === 0 ? "#e11d48" : "#4338ca",
                    },
                  }}
                >
                  {isExisting
                    ? activeTab === 0
                      ? "Post Cash Recovery"
                      : "Post Payment to Company"
                    : "Save Khata Record"}
                </Button>

                <Button variant="outlined" color="inherit" onClick={Clear} startIcon={<ClearRoundedIcon />}>
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Search & Action Bar */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {activeTab === 0 ? "Customer Khata Balances (Receivables)" : "Company / Supplier Balances (Payables)"}
          </Typography>

          <TextField
            size="small"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={
              activeTab === 0
                ? "Search by customer name or balance..."
                : "Search by company / supplier name or balance..."
            }
            sx={{ minWidth: { xs: "100%", sm: 360 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Table View */}
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
          <Table size="medium">
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {activeTab === 0 ? "Customer / Account" : "Company / Supplier"}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {activeTab === 0 ? "Total Recovered" : "Total Paid Till Now"}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Transaction</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remaining Balance</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Last Updated</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(activeTab === 0 ? filteredCustomerRecords : filteredCompanyRecords).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                    {activeTab === 0
                      ? "No customer receivable records found."
                      : "No company payable records found."}
                  </TableCell>
                </TableRow>
              ) : (
                (activeTab === 0 ? filteredCustomerRecords : filteredCompanyRecords).map((r) => {
                  const rem = Number(r.remainingAmount || 0);
                  const isSelected = selectedRecordId === r.id;
                  const displayName = activeTab === 0 ? r.cname || "Walk-in Customer" : r.supplierName || "Supplier";
                  const paidTotal = Number(activeTab === 0 ? r.receivedTillNow || 0 : r.paidTillNow || 0);
                  const recentPayment = Number(activeTab === 0 ? r.receiveToday || 0 : r.paidToday || 0);

                  return (
                    <TableRow
                      key={r.id}
                      hover
                      selected={isSelected}
                      sx={{
                        transition: "background-color 0.15s ease",
                        bgcolor: isSelected ? "rgba(79, 70, 229, 0.04)" : "inherit",
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>#{r.id}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{displayName}</TableCell>
                      <TableCell sx={{ color: "#10b981", fontWeight: 700 }}>
                        PKR {paidTotal.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: "#64748b" }}>
                        PKR {recentPayment.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`PKR ${rem.toLocaleString()}`}
                          size="small"
                          color={rem > 0 ? (activeTab === 0 ? "error" : "primary") : "success"}
                          variant={rem > 0 ? "filled" : "outlined"}
                          sx={{ fontWeight: 800, fontSize: "0.8rem" }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-GB") : "-"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Complete Ledger History">
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={<HistoryRoundedIcon />}
                              onClick={() => handleOpenHistory(r, activeTab === 0 ? "customer" : "company")}
                              sx={{
                                borderRadius: 2,
                                fontWeight: 700,
                                fontSize: "0.75rem",
                                textTransform: "none",
                              }}
                            >
                              History
                            </Button>
                          </Tooltip>

                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PaymentsRoundedIcon />}
                            onClick={() => handleSelectFromRow(r)}
                            sx={{
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              textTransform: "none",
                              bgcolor: activeTab === 0 ? "#f43f5e" : "#4f46e5",
                              "&:hover": {
                                bgcolor: activeTab === 0 ? "#e11d48" : "#4338ca",
                              },
                            }}
                          >
                            {activeTab === 0 ? "Collect" : "Pay"}
                          </Button>

                          <Tooltip title="Delete Khata">
                            <IconButton
                              size="small"
                              sx={{ color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.08)" }}
                              onClick={() => handleDelete(r.id)}
                            >
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

        {/* ─── LEDGER HISTORY MODAL ─── */}
        <Dialog
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle className="no-print" sx={{ pb: 1, bgcolor: "#f8fafc", borderBottom: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: historyTarget?.type === "customer" ? "rgba(244, 63, 94, 0.1)" : "rgba(79, 70, 229, 0.1)",
                    color: historyTarget?.type === "customer" ? "#f43f5e" : "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HistoryRoundedIcon />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {historyTarget?.type === "customer" ? "Customer Khata Ledger" : "Company / Supplier Khata Ledger"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {historyTarget?.type === "customer"
                      ? historyTarget?.record?.cname || "Walk-in Customer"
                      : historyTarget?.record?.supplierName || "Supplier"}{" "}
                    (ID: #{historyTarget?.record?.id})
                  </Typography>
                </Box>
              </Stack>

              <IconButton onClick={() => setHistoryOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Box
              id={billModalOpen ? "printable-ledger-hidden" : "printable-ledger"}
              className={billModalOpen ? "no-print" : ""}
            >
              {/* Printable Header */}
              <Box sx={{ textAlign: "center", mb: 2.5 }}>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a", letterSpacing: "0.02em" }}>
                  USAMA SAEED TYRE SHOP
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#334155" }}>
                  {historyTarget?.type === "customer"
                    ? "CUSTOMER KHATA LEDGER STATEMENT"
                    : "COMPANY / SUPPLIER KHATA LEDGER STATEMENT"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", mt: 0.5 }}>
                  Account: {historyTarget?.type === "customer"
                    ? historyTarget?.record?.cname || "Customer"
                    : historyTarget?.record?.supplierName || "Supplier"}{" "}
                  (ID: #{historyTarget?.record?.id})
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Statement Generated: {new Date().toLocaleDateString("en-GB")} {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Typography>
              </Box>

              {/* Summary Highlights */}
              <Grid container spacing={2} sx={{ mb: 3, mt: 0.5 }}>
                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f1f5f9",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {historyTarget?.type === "customer" ? "Total Recovered Till Now" : "Total Paid Till Now"}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#10b981", mt: 0.5 }}>
                      PKR{" "}
                      {Number(
                        historyTarget?.type === "customer"
                          ? historyTarget?.record?.receivedTillNow || 0
                          : historyTarget?.record?.paidTillNow || 0
                      ).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: historyTarget?.type === "customer" ? "rgba(244, 63, 94, 0.05)" : "rgba(79, 70, 229, 0.05)",
                      border: "1px solid",
                      borderColor: historyTarget?.type === "customer" ? "rgba(244, 63, 94, 0.2)" : "rgba(79, 70, 229, 0.2)",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Current Remaining Khata Due
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: historyTarget?.type === "customer" ? "#ef4444" : "#4f46e5",
                        mt: 0.5,
                      }}
                    >
                      PKR {Number(historyTarget?.record?.remainingAmount || 0).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: "#f8fafc",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Recorded Transactions
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#334155", mt: 0.5 }}>
                      {parsedHistoryEntries.length} Entries
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2.5 }} />

              {/* History Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#1e293b" }}>
                Chronological Transaction Statement & Itemized Manifest:
              </Typography>

              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f8fafc" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, width: "5%" }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "16%" }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, width: "16%" }}>Transaction / Ref</TableCell>
                      <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Tyres & Specifications</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: "10%" }}>Total Bill</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: "10%" }}>Paid</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, width: "11%" }}>Remaining</TableCell>
                      <TableCell align="center" className="no-print" sx={{ fontWeight: 700, width: "90px" }}>Bill / Receipt</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {parsedHistoryEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
                          No specific itemized history entries found for this ledger.
                        </TableCell>
                      </TableRow>
                    ) : (
                      parsedHistoryEntries.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b" }}>{row.id}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                            {row.date} {row.time && <Typography variant="caption" color="text.secondary">({row.time})</Typography>}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {row.type}
                            </Typography>
                            {row.ref !== "-" && (
                              <Typography variant="caption" sx={{ color: "#4f46e5", fontWeight: 700 }}>
                                {row.ref}
                              </Typography>
                            )}
                          </TableCell>

                          {/* Tyres & Specifications: Clean Eye Icon to open Buying Details */}
                          <TableCell sx={{ minWidth: 160 }}>
                            {row.saleItems.length > 0 || row.purchaseItems.length > 0 ? (
                              (() => {
                                const items = row.saleItems.length > 0 ? row.saleItems : row.purchaseItems;
                                const totalUnits = items.reduce(
                                  (acc, curr) => acc + Number(curr.qty || curr.quantity || 0),
                                  0
                                );

                                return (
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      label={`${totalUnits} tyres`}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        bgcolor: "rgba(2, 132, 199, 0.08)",
                                        color: "#0284c7",
                                      }}
                                    />
                                    <Tooltip title="Click to view Buying / Sales Details & Tyre Breakdown">
                                      <IconButton
                                        size="small"
                                        onClick={() => handleOpenReceipt(row)}
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
                              })()
                            ) : (
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  label="Payment Voucher"
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    bgcolor: "#f1f5f9",
                                    color: "#475569",
                                    fontSize: "0.75rem",
                                  }}
                                />
                                {row.vehicle && (
                                  <Chip
                                    label={row.vehicle}
                                    size="small"
                                    sx={{
                                      fontSize: "0.75rem",
                                      bgcolor: "rgba(79, 70, 229, 0.08)",
                                      color: "#4f46e5",
                                      fontWeight: 700,
                                    }}
                                  />
                                )}
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.82rem" }}>
                                  {row.remarks || "Payment transaction recorded in ledger"}
                                </Typography>
                              </Stack>
                            )}
                          </TableCell>

                          <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                            {row.bill > 0 ? `PKR ${row.bill.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ color: "#10b981", fontWeight: 700, whiteSpace: "nowrap" }}>
                            {row.paid > 0 ? `PKR ${row.paid.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell align="right" sx={{ color: "#ef4444", fontWeight: 800, whiteSpace: "nowrap" }}>
                            PKR {row.rem.toLocaleString()}
                          </TableCell>

                          {/* Bill / Receipt Action Link */}
                          <TableCell align="center" className="no-print">
                            {row.hasBill ? (
                              <Tooltip title="View / Print Complete Bill Receipt">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenReceipt(row)}
                                  sx={{
                                    color: historyTarget?.type === "customer" ? "#f43f5e" : "#0284c7",
                                    bgcolor:
                                      historyTarget?.type === "customer"
                                        ? "rgba(244, 63, 94, 0.08)"
                                        : "rgba(2, 132, 199, 0.08)",
                                    border: "1px solid",
                                    borderColor:
                                      historyTarget?.type === "customer"
                                        ? "rgba(244, 63, 94, 0.25)"
                                        : "rgba(2, 132, 199, 0.25)",
                                    transition: "all 0.2s ease",
                                    "&:hover": {
                                      bgcolor:
                                        historyTarget?.type === "customer" ? "#f43f5e" : "#0284c7",
                                      color: "#ffffff",
                                      transform: "scale(1.08)",
                                    },
                                  }}
                                >
                                  <ReceiptLongRoundedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Chip
                                label="Cash Voucher"
                                size="small"
                                sx={{ fontSize: "0.72rem", color: "text.secondary", bgcolor: "rgba(0,0,0,0.04)" }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Authorized Signatures for Printed Statement */}
              <Box sx={{ mt: 5, pt: 2, display: "flex", justifyContent: "space-between", px: 2 }}>
                <Box sx={{ textAlign: "center", minWidth: 220, borderTop: "1px dashed #64748b", pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block" }}>
                    Authorized Signature / Shop Stamp
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center", minWidth: 220, borderTop: "1px dashed #64748b", pt: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: "#334155", display: "block" }}>
                    {historyTarget?.type === "customer" ? "Customer Signature" : "Company / Supplier Signature"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions className="no-print" sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
            <Button
              variant="outlined"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Print Ledger Statement
            </Button>
            <Button
              variant="contained"
              onClick={() => setHistoryOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* ─── ITEMIZED BILL / INVOICE RECEIPT MODAL ─── */}
        <Dialog
          open={billModalOpen}
          onClose={() => setBillModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >

          <DialogTitle
            className="no-print"
            sx={{
              m: 0,
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  bgcolor: selectedBill?.type === "customer" ? "rgba(244, 63, 94, 0.1)" : "rgba(79, 70, 229, 0.1)",
                  color: selectedBill?.type === "customer" ? "#f43f5e" : "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selectedBill?.type === "customer" ? (
                  <ReceiptLongRoundedIcon fontSize="small" />
                ) : (
                  <LocalShippingRoundedIcon fontSize="small" />
                )}
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {selectedBill?.type === "customer"
                  ? "Customer Sales Invoice & Bill Receipt"
                  : "Supplier Stock Purchase Consignment Bill"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                size="small"
                variant="contained"
                startIcon={<PrintRoundedIcon />}
                onClick={() => window.print()}
                sx={{
                  bgcolor: selectedBill?.type === "customer" ? "#f43f5e" : "#4f46e5",
                  "&:hover": { bgcolor: selectedBill?.type === "customer" ? "#e11d48" : "#4338ca" },
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              >
                Print Bill
              </Button>
              <IconButton size="small" onClick={() => setBillModalOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            {selectedBill && (
              <Box id="printable-bill">
                <Box sx={{ textAlign: "center", mb: 2.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#0f172a", letterSpacing: "0.02em" }}>
                    USAMA SAEED TYRE SHOP
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {selectedBill.type === "customer"
                      ? "Official Customer Sales Invoice"
                      : "Stock-In Consignment Purchase Receipt"}
                  </Typography>
                </Box>

                <Paper sx={{ p: 2, bgcolor: "#f8fafc", mb: 2.5, borderRadius: 2, border: "1px solid #e2e8f0" }} elevation={0}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">
                        {selectedBill.type === "customer" ? "Customer / Account:" : "Supplier / Company:"}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {selectedBill.entityName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Invoice / Bill Ref:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: "#4f46e5" }}>
                        {selectedBill.ref}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Date & Time:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedBill.date} {selectedBill.time}
                      </Typography>
                    </Grid>

                    {selectedBill.contact && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Contact Phone:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedBill.contact}
                        </Typography>
                      </Grid>
                    )}

                    {selectedBill.vehicleNo && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Vehicle Plate:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                          {selectedBill.vehicleNo}
                        </Typography>
                      </Grid>
                    )}

                    {selectedBill.vehicleModel && (
                      <Grid item xs={6} sm={4}>
                        <Typography variant="caption" color="text.secondary">Vehicle Model:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {selectedBill.vehicleModel}
                        </Typography>
                      </Grid>
                    )}

                    <Grid item xs={6} sm={4}>
                      <Typography variant="caption" color="text.secondary">Khata Status:</Typography>
                      <Chip
                        label={selectedBill.status}
                        size="small"
                        color={selectedBill.rem > 0 ? "error" : "success"}
                        sx={{ fontWeight: 800, height: 22, mt: 0.2 }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: "#0f172a" }}>
                  Itemized Tyre Manifest:
                </Typography>

                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 2, mb: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Tyre Description / Brand</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                        {selectedBill.type === "company" && (
                          <TableCell sx={{ fontWeight: 700 }}>Origin & DOT</TableCell>
                        )}
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Rate (PKR)</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Total (PKR)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!selectedBill.items || selectedBill.items.length === 0) ? (
                        <TableRow>
                          <TableCell
                            colSpan={selectedBill.type === "company" ? 7 : 6}
                            align="center"
                            sx={{ py: 3, color: "text.secondary" }}
                          >
                            {selectedBill.remarks || "Direct ledger debit entry recorded for this transaction."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedBill.items.map((it, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ color: "#64748b", fontWeight: 600 }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                              {it.name || `${it.brand} ${it.pattern || ""}`.trim()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={it.size || "Standard"}
                                size="small"
                                sx={{ fontWeight: 700, bgcolor: "#f8fafc" }}
                              />
                            </TableCell>
                            {selectedBill.type === "company" && (
                              <TableCell sx={{ fontSize: "0.8rem", color: "#64748b" }}>
                                {[it.origin, it.dot].filter(Boolean).join(" • ") || "-"}
                              </TableCell>
                            )}
                            <TableCell align="center" sx={{ fontWeight: 700 }}>
                              {it.qty}
                            </TableCell>
                            <TableCell align="right">
                              PKR {(it.price || it.cost || 0).toLocaleString()}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: "#0f172a" }}>
                              PKR {it.subtotal.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Financial Summary */}
                <Box sx={{ width: { xs: "100%", sm: "320px" }, ml: "auto" }}>
                  <Paper sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #e2e8f0" }} elevation={0}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Total Bill Amount:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          PKR {Number(selectedBill.totalBill || 0).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Amount Paid / Recovered:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: "#10b981" }}>
                          PKR {Number(selectedBill.paid || 0).toLocaleString()}
                        </Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Remaining Balance Due:</Typography>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 900,
                            color: selectedBill.rem > 0 ? "#ef4444" : "#10b981",
                          }}
                        >
                          PKR {Number(selectedBill.rem || 0).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Box>
              </Box>
            )}
          </DialogContent>

          <DialogActions className="no-print" sx={{ p: 2.5, bgcolor: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <Button
              variant="outlined"
              startIcon={<PrintRoundedIcon />}
              onClick={() => window.print()}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Print Bill Receipt
            </Button>
            <Button
              variant="contained"
              onClick={() => setBillModalOpen(false)}
              sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}
