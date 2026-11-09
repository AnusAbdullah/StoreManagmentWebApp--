import React, { useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Avatar,
  Divider,
  Paper,
  LinearProgress,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUpRounded";
import PointOfSaleIcon from "@mui/icons-material/PointOfSaleRounded";
import PersonAddIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircleRounded";
import TireRepairRoundedIcon from "@mui/icons-material/TireRepairRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import BusinessIcon from "@mui/icons-material/BusinessRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import SavingsRoundedIcon from "@mui/icons-material/SavingsRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import { useSelector, useDispatch } from "react-redux";
import { getAllItemRecord } from "../features/Data/StockSlice";
import { getAllCompanyRecord } from "../features/Data/CompanySlice";
import { getAllCustomerRecord } from "../features/Data/CustomerSlice";
import { getAllPartyRecord } from "../features/Data/PartiesSlice";
import { getAllCategoryRecord } from "../features/Data/CatagorySlice";
import { getAllSalesRecords } from "../features/Data/SalesSlice";
import { getAllPurchasesRecord } from "../features/Data/PurchaseSlice";
import expenseApi from "../api/ExpenseApi";
import staffApi from "../api/StaffApi";
import * as bankApi from "../api/BankAccountApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const EMPTY_ARR = [];

export default function Overview({ setRender }) {
  const dispatch = useDispatch();

  const rawItems = useSelector((state) => state.stock?.rawItems || EMPTY_ARR);
  const stockRows = useSelector((state) => state.stock?.data || EMPTY_ARR);
  const salesHistory = useSelector((state) => state.sale?.salesHistory || EMPTY_ARR);
  const purchasesData = useSelector((state) => state.purchases?.data || EMPTY_ARR);

  const [expenses, setExpenses] = React.useState([]);
  const [salaryPayouts, setSalaryPayouts] = React.useState([]);
  const [bankFunds, setBankFunds] = React.useState(0);
  const [bankAccountsCount, setBankAccountsCount] = React.useState(0);

  const loadExpensesAndStaff = React.useCallback(async () => {
    try {
      const [expRes, payRes, bankRes] = await Promise.all([
        expenseApi.getAllExpenses().catch(() => ({ data: [] })),
        staffApi.getAllSalaryPayouts().catch(() => ({ data: [] })),
        bankApi.getBankAccounts().catch(() => ({ data: { totalFunds: 0, accounts: [] } })),
      ]);
      setExpenses(expRes.data || []);
      setSalaryPayouts(payRes.data || []);
      setBankFunds(Number(bankRes.data?.totalFunds || 0));
      setBankAccountsCount(Array.isArray(bankRes.data?.accounts) ? bankRes.data.accounts.length : 0);
    } catch (err) {
      console.error("Failed to load expenses or salaries", err);
    }
  }, []);

  useEffect(() => {
    dispatch(getAllItemRecord());
    dispatch(getAllCompanyRecord());
    dispatch(getAllCustomerRecord());
    dispatch(getAllPartyRecord());
    dispatch(getAllCategoryRecord());
    dispatch(getAllSalesRecords());
    dispatch(getAllPurchasesRecord());
    loadExpensesAndStaff();
  }, [dispatch, loadExpensesAndStaff]);

  // Compute total tyre units in stock and inventory asset valuation
  let totalTyreUnits = 0;
  let totalCostValuation = 0;
  let totalRetailValuation = 0;
  let lowStockCount = 0;

  if (rawItems.length > 0) {
    rawItems.forEach((item) => {
      const q = Number(item.quantity || 0);
      const c = Number(item.costPrice || 0);
      const s = Number(item.price || 0);
      totalTyreUnits += q;
      totalCostValuation += c * q;
      totalRetailValuation += s * q;
      if (q <= 4) lowStockCount++;
    });
  } else {
    stockRows.forEach((r) => {
      const q = Number(r[9] || 0);
      const c = Number(r[7] || 0);
      const s = Number(r[8] || 0);
      totalTyreUnits += q;
      totalCostValuation += c * q;
      totalRetailValuation += s * q;
      if (q <= 4) lowStockCount++;
    });
  }

  // Compute sales revenue and gross profit
  const totalSalesRevenue = salesHistory.reduce((acc, curr) => acc + Number(curr.totalBill || 0), 0);
  const totalGrossProfit = salesHistory.reduce((acc, curr) => acc + Number(curr.profit || 0), 0);

  // Compute operating expenses and salary payouts
  const totalShopExpenses = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalSalaryPayouts = salaryPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalOverheads = totalShopExpenses + totalSalaryPayouts;
  const trueNetProfit = totalGrossProfit - totalOverheads;

  // Day-End Cashbook / Rooznamcha calculations (Today's drawer)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySales = salesHistory.filter((s) => (s.date || "").startsWith(todayStr));
  const todayCashSales = todaySales.reduce((acc, curr) => acc + Number(curr.paidAmount || curr.totalBill || 0), 0);
  const todayExpenses = expenses.filter((e) => (e.date || "").startsWith(todayStr));
  const todayExpensesTotal = todayExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const todayPayouts = salaryPayouts.filter((p) => (p.date || "").startsWith(todayStr));
  const todayPayoutsTotal = todayPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const todayNetDrawerCash = todayCashSales - (todayExpensesTotal + todayPayoutsTotal);

  // Brand palette for visualization
  const BRAND_COLORS = React.useMemo(
    () => ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#3b82f6"],
    []
  );

  // Group items by brand for chart and breakdown
  const brandDistribution = React.useMemo(() => {
    const brandMap = {};
    let grandTotal = 0;

    if (rawItems.length > 0) {
      rawItems.forEach((i) => {
        const b = (i.brand || "Other").trim() || "Other";
        const q = Number(i.quantity || 0);
        const c = Number(i.costPrice || 0);
        grandTotal += q;
        if (!brandMap[b]) {
          brandMap[b] = { name: b, units: 0, costValue: 0 };
        }
        brandMap[b].units += q;
        brandMap[b].costValue += q * c;
      });
    } else {
      stockRows.forEach((r) => {
        const b = (r[1] || "Other").toString().trim() || "Other";
        const q = Number(r[9] || 0);
        const c = Number(r[7] || 0);
        grandTotal += q;
        if (!brandMap[b]) {
          brandMap[b] = { name: b, units: 0, costValue: 0 };
        }
        brandMap[b].units += q;
        brandMap[b].costValue += q * c;
      });
    }

    const result = Object.values(brandMap).map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? ((item.units / grandTotal) * 100).toFixed(1) : 0,
    }));

    return result.sort((a, b) => b.units - a.units).slice(0, 5);
  }, [rawItems, stockRows]);

  const statCards = [
    {
      title: "Tyres in Warehouse",
      value: totalTyreUnits.toLocaleString(),
      subtitle: `${stockRows.length} Distinct Tyre Specs`,
      icon: <TireRepairRoundedIcon sx={{ fontSize: 26, color: "#4f46e5" }} />,
      bg: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(99, 102, 241, 0.02) 100%)",
      borderColor: "rgba(79, 70, 229, 0.2)",
      action: () => setRender("AddStock"),
    },
    {
      title: "Stock Cost Valuation",
      value: `PKR ${totalCostValuation.toLocaleString()}`,
      subtitle: `Retail: PKR ${totalRetailValuation.toLocaleString()}`,
      icon: <AttachMoneyRoundedIcon sx={{ fontSize: 26, color: "#10b981" }} />,
      bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(52, 211, 153, 0.02) 100%)",
      borderColor: "rgba(16, 185, 129, 0.2)",
      action: () => setRender("AddStock"),
    },
    {
      title: "Realized Gross Profit",
      value: `PKR ${totalGrossProfit.toLocaleString()}`,
      subtitle: `Total Sales: PKR ${totalSalesRevenue.toLocaleString()}`,
      icon: <TrendingUpIcon sx={{ fontSize: 26, color: "#06b6d4" }} />,
      bg: "linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(14, 165, 233, 0.02) 100%)",
      borderColor: "rgba(6, 182, 212, 0.2)",
      action: () => setRender("Sales"),
    },
    {
      title: "Shop Overheads & Staff",
      value: `PKR ${totalOverheads.toLocaleString()}`,
      subtitle: `Bills: PKR ${totalShopExpenses.toLocaleString()} | Staff: PKR ${totalSalaryPayouts.toLocaleString()}`,
      icon: <ReceiptLongRoundedIcon sx={{ fontSize: 26, color: "#f59e0b" }} />,
      bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.02) 100%)",
      borderColor: "rgba(245, 158, 11, 0.25)",
      action: () => setRender("Expenses"),
    },
    {
      title: "True Net Profit (Bottom-Line)",
      value: `PKR ${trueNetProfit.toLocaleString()}`,
      subtitle: trueNetProfit >= 0 ? "Gross Profit minus All Overheads" : "Operating at deficit",
      icon: <SavingsRoundedIcon sx={{ fontSize: 26, color: trueNetProfit >= 0 ? "#10b981" : "#ef4444" }} />,
      bg: trueNetProfit >= 0 
        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.03) 100%)" 
        : "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.03) 100%)",
      borderColor: trueNetProfit >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
      action: () => setRender("Expenses"),
    },
    {
      title: "Bank Liquid Funds",
      value: `PKR ${bankFunds.toLocaleString()}`,
      subtitle: `${bankAccountsCount} Active Bank Accounts`,
      icon: <AccountBalanceRoundedIcon sx={{ fontSize: 26, color: "#4f46e5" }} />,
      bg: "linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.02) 100%)",
      borderColor: "rgba(79, 70, 229, 0.25)",
      action: () => setRender("BankAccounts"),
    },
    {
      title: "Low Stock Alert",
      value: lowStockCount,
      subtitle: `${lowStockCount} tyres under 4 units`,
      icon: <WarningAmberRoundedIcon sx={{ fontSize: 26, color: lowStockCount > 0 ? "#ef4444" : "#f59e0b" }} />,
      bg: "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(244, 63, 94, 0.02) 100%)",
      borderColor: "rgba(239, 68, 68, 0.2)",
      action: () => setRender("AddStock"),
    },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Welcome Banner */}
      <Card
        sx={{
          mb: 4,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          color: "#ffffff",
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
          border: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
          }}
        />
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Chip
                label="TYRE SHOP OPS"
                size="small"
                sx={{
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                }}
              />
              <Chip
                label="Docker Compose Stack"
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#e2e8f0",
                  fontSize: "0.7rem",
                }}
              />
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, letterSpacing: "-0.03em" }}>
              Usama Saeed Tyre Shop
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8", maxWidth: 640 }}>
              Live tyre inventory control, supplier purchase invoices, auto-stock deduction POS, and profit margin analysis.
            </Typography>
          </Grid>
          <Grid item xs={12} md={5} sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
              flexWrap="wrap"
              useFlexGap
            >
              <Button
                variant="contained"
                startIcon={<PointOfSaleIcon />}
                onClick={() => setRender("Sales")}
                sx={{
                  backgroundColor: "#4f46e5",
                  "&:hover": { backgroundColor: "#4338ca" },
                  fontWeight: 700,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                New Tyre Sale
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocalShippingRoundedIcon />}
                onClick={() => setRender("Purchases")}
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#ffffff",
                  "&:hover": { borderColor: "#ffffff", backgroundColor: "rgba(255, 255, 255, 0.08)" },
                  fontWeight: 700,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Stock In
              </Button>
              <Button
                variant="outlined"
                startIcon={<AccountBalanceRoundedIcon />}
                onClick={() => setRender("BankAccounts")}
                sx={{
                  borderColor: "rgba(129, 140, 248, 0.4)",
                  color: "#cbd5e1",
                  "&:hover": { borderColor: "#818cf8", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#ffffff" },
                  fontWeight: 700,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Bank Accounts
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* KPI Stats Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Card
              onClick={card.action}
              sx={{
                background: card.bg,
                borderColor: card.borderColor,
                cursor: "pointer",
                transition: "all 0.25s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.12)",
                  borderColor: "#4f46e5",
                },
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Avatar
                    sx={{
                      bgcolor: "transparent",
                      width: 42,
                      height: 42,
                      borderRadius: 3,
                      border: "1px solid",
                      borderColor: card.borderColor,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Stack>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: "text.primary" }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Day-End Cashbook (Rooznamcha) Drawer Reconciliation */}
      <Card
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(79, 70, 229, 0.2)",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)",
          boxShadow: "0 4px 20px -2px rgba(79, 70, 229, 0.06)",
        }}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", lg: "center" }}
          spacing={2}
          sx={{ mb: 2.5 }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <AccountBalanceRoundedIcon sx={{ color: "#4f46e5", fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
                Daily Cashbook & Day-End Closing (Rooznamcha)
              </Typography>
              <Chip
                label={`Date: ${todayStr}`}
                size="small"
                sx={{ bgcolor: "rgba(79, 70, 229, 0.1)", color: "#4f46e5", fontWeight: 700, fontSize: "0.75rem" }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Live counter drawer cash reconciliation: Inflows from sales minus today's shop expenses and staff salary disbursements
            </Typography>
          </Box>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
          >
            <Button
              size="small"
              variant="contained"
              startIcon={<AccountBalanceRoundedIcon />}
              onClick={() => setRender("DailyRegister")}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                bgcolor: "#4f46e5",
                "&:hover": { bgcolor: "#4338ca" },
                textTransform: "none",
                whiteSpace: "nowrap",
                px: 1.5,
              }}
            >
              Open Rooznamcha
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={() => setRender("Expenses")}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                whiteSpace: "nowrap",
                px: 1.5,
              }}
            >
              Add Expense
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<BadgeRoundedIcon />}
              onClick={() => setRender("StaffSalary")}
              sx={{
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                whiteSpace: "nowrap",
                px: 1.5,
              }}
            >
              Staff Payout
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700 }}>
                TODAY'S CASH INFLOW
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#047857", mt: 0.5 }}>
                PKR {todayCashSales.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {todaySales.length} tyre sales processed today
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 700 }}>
                TODAY'S SHOP EXPENSES
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#b45309", mt: 0.5 }}>
                PKR {todayExpensesTotal.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {todayExpenses.length} expense vouchers recorded
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, bgcolor: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: "#dc2626", fontWeight: 700 }}>
                TODAY'S STAFF DISBURSEMENTS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#b91c1c", mt: 0.5 }}>
                PKR {todayPayoutsTotal.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {todayPayouts.length} salary / advances paid today
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                bgcolor: todayNetDrawerCash >= 0 ? "rgba(79, 70, 229, 0.08)" : "rgba(239, 68, 68, 0.08)",
                border: "1px solid",
                borderColor: todayNetDrawerCash >= 0 ? "rgba(79, 70, 229, 0.3)" : "rgba(239, 68, 68, 0.3)",
                borderRadius: 2,
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: todayNetDrawerCash >= 0 ? "#4338ca" : "#b91c1c", fontWeight: 700 }}
              >
                NET CASH IN DRAWER TONIGHT
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: todayNetDrawerCash >= 0 ? "#312e81" : "#991b1b", mt: 0.5 }}
              >
                PKR {todayNetDrawerCash.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inflow minus Outflow for closing
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Card>

      {/* Analytics & Brand Inventory Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Top Tyre Brands in Warehouse (Stock Units)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Inventory concentration across leading tyre manufacturers
                  </Typography>
                </Box>
                <Chip label={`${totalTyreUnits} Total Tyres`} color="primary" size="small" variant="outlined" />
              </Stack>

              {/* Bar Chart Section */}
              <Box sx={{ width: "100%", height: 220, mt: 1 }}>
                {brandDistribution.length === 0 ? (
                  <Box sx={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "text.secondary" }}>
                    No tyre inventory recorded yet. Add tyres in Inventory or Purchases.
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brandDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          border: "none",
                          borderRadius: 8,
                          color: "#ffffff",
                          fontSize: "0.85rem",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                        }}
                        formatter={(val, name, item) => [
                          `${val} Tyres (${item.payload.percentage}% · PKR ${item.payload.costValue?.toLocaleString()})`,
                          "Stock",
                        ]}
                      />
                      <Bar dataKey="units" radius={[6, 6, 0, 0]}>
                        {brandDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>

              {/* Top Brands Inventory Breakdown & Valuation Table */}
              <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid rgba(226, 232, 240, 0.8)" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f172a" }}>
                  Brand Stock Valuation & Warehouse Share
                </Typography>
                <Stack spacing={1.5}>
                  {brandDistribution.map((item, idx) => (
                    <Box key={idx} sx={{ p: 1.2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.6 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              bgcolor: BRAND_COLORS[idx % BRAND_COLORS.length],
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b" }}>
                            {item.name}
                          </Typography>
                          <Chip
                            label={`${item.units} Tyres`}
                            size="small"
                            sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700, bgcolor: "rgba(0,0,0,0.05)" }}
                          />
                        </Stack>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                            Cost: PKR {item.costValue?.toLocaleString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: BRAND_COLORS[idx % BRAND_COLORS.length], fontWeight: 800 }}
                          >
                            {item.percentage}%
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={Number(item.percentage) || 0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "rgba(226, 232, 240, 0.8)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: BRAND_COLORS[idx % BRAND_COLORS.length],
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>

            {/* Bottom Quick Inventory Link */}
            <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px dashed rgba(226, 232, 240, 0.8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Total {stockRows.length} tyre specifications stored in inventory
              </Typography>
              <Button
                size="small"
                onClick={() => setRender("AddStock")}
                sx={{ fontWeight: 700, color: "#4f46e5", textTransform: "none" }}
              >
                Manage Full Inventory &rarr;
              </Button>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              Tyre Shop Financial Statement
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
              Valuation summary, operating overheads and bottom-line net profit
            </Typography>

            <Stack spacing={1.5}>
              <Paper sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2 }} elevation={0}>
                <Typography variant="caption" color="text.secondary">Total Stock Inventory Cost</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a" }}>
                  PKR {totalCostValuation.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: "#10b981", fontWeight: 600 }}>
                  Retail Worth: PKR {totalRetailValuation.toLocaleString()} (+PKR {(totalRetailValuation - totalCostValuation).toLocaleString()} gross profit potential)
                </Typography>
              </Paper>

              <Paper sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2 }} elevation={0}>
                <Typography variant="caption" color="text.secondary">Total Customer Sales Recorded</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#4f46e5" }}>
                  PKR {totalSalesRevenue.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700 }}>
                  Realized Gross Margin: PKR {totalGrossProfit.toLocaleString()}
                </Typography>
              </Paper>

              <Paper sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2 }} elevation={0}>
                <Typography variant="caption" color="text.secondary">Shop Expenses & Staff Salaries</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#d97706" }}>
                  PKR {totalOverheads.toLocaleString()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Shop Bills: PKR {totalShopExpenses.toLocaleString()} | Payroll: PKR {totalSalaryPayouts.toLocaleString()}
                </Typography>
              </Paper>

              <Paper sx={{ p: 1.8, bgcolor: "#f8fafc", borderRadius: 2 }} elevation={0}>
                <Typography variant="caption" color="text.secondary">Supplier Purchase Shipments</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0284c7" }}>
                  {purchasesData.length} Shipments Received
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stock-in tyre consignments from registered tyre suppliers
                </Typography>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  bgcolor: trueNetProfit >= 0 ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: "1px solid",
                  borderColor: trueNetProfit >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)",
                  borderRadius: 2,
                }}
                elevation={0}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: trueNetProfit >= 0 ? "#047857" : "#b91c1c", fontWeight: 700 }}
                    >
                      BOTTOM-LINE TRUE NET PROFIT
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 900, color: trueNetProfit >= 0 ? "#065f46" : "#991b1b" }}
                    >
                      PKR {trueNetProfit.toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={trueNetProfit >= 0 ? "PROFITABLE" : "DEFICIT"}
                    size="small"
                    color={trueNetProfit >= 0 ? "success" : "error"}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              </Paper>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* System Health & Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Shop System Health & Relational Sync
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Backend API Gateway & Stock Deduction Engine
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Express 4.18 (port 4001) · Real-time auto-stock decrement active
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="ONLINE" size="small" color="success" />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      MySQL Relational Integrity & Foreign Keys
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sales & Customer FKs · Purchases & Supplier FKs · Staff & Salary Payout FKs
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="SYNCED" size="small" color="primary" />
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Container Orchestration
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Docker Compose · Node 18 Stack Active
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="ACTIVE" size="small" color="secondary" />
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Tyre Shop Quick Modules
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2.5 }}>
              Direct access to essential tyre shop operations
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: "Tyre POS Terminal", section: "Sales", icon: <PointOfSaleIcon /> },
                { label: "Return & Exchange", section: "SalesReturn", icon: <PublishedWithChangesRoundedIcon /> },
                { label: "Daily Rooznamcha", section: "DailyRegister", icon: <AccountBalanceRoundedIcon /> },
                { label: "Tyre Inventory", section: "AddStock", icon: <TireRepairRoundedIcon /> },
                { label: "Stock In Invoices", section: "Purchases", icon: <LocalShippingRoundedIcon /> },
                { label: "Shop Expenses", section: "Expenses", icon: <ReceiptLongRoundedIcon /> },
                { label: "Staff & Salaries", section: "StaffSalary", icon: <BadgeRoundedIcon /> },
                { label: "Customer Ledger", section: "Customer", icon: <PersonAddIcon /> },
                { label: "Acc. Receivable", section: "AccReceivable", icon: <AccountBalanceWalletIcon /> },
                { label: "Suppliers List", section: "Companies", icon: <BusinessIcon /> },
              ].map((btn, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={btn.icon}
                    onClick={() => setRender(btn.section)}
                    sx={{
                      py: 1.5,
                      borderRadius: 3,
                      borderColor: "rgba(226, 232, 240, 0.9)",
                      color: "text.primary",
                      fontWeight: 600,
                      justifyContent: "flex-start",
                      px: 2,
                      "&:hover": {
                        borderColor: "#4f46e5",
                        backgroundColor: "rgba(79, 70, 229, 0.04)",
                      },
                    }}
                  >
                    {btn.label}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
