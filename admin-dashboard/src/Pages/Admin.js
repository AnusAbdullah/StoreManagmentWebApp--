import * as React from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/LogoutRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import LocalShippingRoundedIcon from "@mui/icons-material/LocalShippingRounded";
import TireRepairRoundedIcon from "@mui/icons-material/TireRepairRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import PublishedWithChangesRoundedIcon from "@mui/icons-material/PublishedWithChangesRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import theme from "../theme";
import Overview from "../components/Overview";
import CompanyForm from "../components/CompanyForm";
import CustomerForm from "../components/CustomerForm";
import Catagory from "../components/Catagory";
import AddStock from "../components/AddStock";
import AccReceivable from "../components/AccReceivable";
import SalesForm from "../components/SalesForm";
import Parties from "../components/Parties";
import PurchaseInvoice from "../components/PurchaseInvoice";
import Expenses from "../components/Expenses";
import StaffSalary from "../components/StaffSalary";
import DailyRegister from "../components/DailyRegister";
import SalesReturn from "../components/SalesReturn";
import BankAccounts from "../components/BankAccounts";

import { getAllCompanyRecord } from "../features/Data/CompanySlice";
import { getAllCustomerRecord } from "../features/Data/CustomerSlice";
import { getAllCategoryRecord } from "../features/Data/CatagorySlice";
import { getAllPartyRecord } from "../features/Data/PartiesSlice";
import { getAllItemRecord } from "../features/Data/StockSlice";
import { getAllPurchasesRecord } from "../features/Data/PurchaseSlice";

const drawerWidth = 295;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  backdropFilter: "blur(12px)",
  color: "#0f172a",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
  borderBottom: "1px solid rgba(226, 232, 240, 0.8)",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    borderRight: "1px solid rgba(30, 41, 59, 0.8)",
    overflowX: "hidden",
    boxSizing: "border-box",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(9),
    }),
  },
}));

function DashboardContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(true);
  const [render, setRender] = React.useState("Overview");

  // Read stored user details if available
  const storedUser = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = [
    {
      id: "Overview",
      label: "Dashboard",
      icon: <DashboardRoundedIcon />,
      action: () => setRender("Overview"),
    },
    {
      id: "Sales",
      label: "Sales Terminal",
      icon: <PointOfSaleRoundedIcon />,
      action: () => {
        setRender("Sales");
        dispatch(getAllCategoryRecord());
        dispatch(getAllCustomerRecord());
        dispatch(getAllItemRecord());
      },
    },
    {
      id: "SalesReturn",
      label: "Return & Exchange",
      icon: <PublishedWithChangesRoundedIcon />,
      action: () => setRender("SalesReturn"),
    },
    {
      id: "DailyRegister",
      label: "Daily Register (Rooznamcha)",
      icon: <AccountBalanceRoundedIcon />,
      action: () => setRender("DailyRegister"),
    },
    {
      id: "AddStock",
      label: "Tyre Inventory",
      icon: <TireRepairRoundedIcon />,
      action: () => {
        setRender("AddStock");
        dispatch(getAllCategoryRecord());
        dispatch(getAllItemRecord());
      },
    },
    {
      id: "Purchases",
      label: "Purchases (Stock In)",
      icon: <LocalShippingRoundedIcon />,
      action: () => {
        setRender("Purchases");
        dispatch(getAllPurchasesRecord());
        dispatch(getAllCompanyRecord());
        dispatch(getAllPartyRecord());
        dispatch(getAllItemRecord());
      },
    },
    {
      id: "Customer",
      label: "Customers",
      icon: <PersonRoundedIcon />,
      action: () => {
        setRender("Customer");
        dispatch(getAllCustomerRecord());
      },
    },
    {
      id: "AccReceivable",
      label: "Accounts (Khata)",
      icon: <AccountBalanceWalletRoundedIcon />,
      action: () => {
        setRender("AccReceivable");
        dispatch(getAllCustomerRecord());
        dispatch(getAllCompanyRecord());
      },
    },
    {
      id: "BankAccounts",
      label: "Bank Accounts & Funds",
      icon: <AccountBalanceRoundedIcon />,
      action: () => {
        setRender("BankAccounts");
      },
    },
    {
      id: "Companies",
      label: "Suppliers",
      icon: <BusinessRoundedIcon />,
      action: () => {
        setRender("Companies");
        dispatch(getAllCompanyRecord());
      },
    },
    {
      id: "Party",
      label: "Trading Parties",
      icon: <PeopleAltRoundedIcon />,
      action: () => {
        setRender("Party");
        dispatch(getAllPartyRecord());
      },
    },
    {
      id: "Expenses",
      label: "Shop Expenses",
      icon: <ReceiptLongRoundedIcon />,
      action: () => {
        setRender("Expenses");
      },
    },
    {
      id: "StaffSalary",
      label: "Staff & Salaries",
      icon: <BadgeRoundedIcon />,
      action: () => {
        setRender("StaffSalary");
      },
    },
    {
      id: "Category",
      label: "Vehicle Categories",
      icon: <CategoryRoundedIcon />,
      action: () => {
        setRender("Category");
        dispatch(getAllCategoryRecord());
      },
    },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f8fafc" }}>
        <CssBaseline />

        {/* Top Navigation Bar */}
        <AppBar position="absolute" open={open}>
          <Toolbar sx={{ pr: 3, pl: open ? 3 : 2 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              component="h1"
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <span>Usama Saeed Tyre Shop</span>
              <Chip
                label={render}
                size="small"
                sx={{
                  bgcolor: "rgba(79, 70, 229, 0.1)",
                  color: "#4f46e5",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: 2,
                }}
              />
            </Typography>

            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                avatar={<Avatar sx={{ bgcolor: "#4f46e5" }}>{storedUser.name ? storedUser.name[0] : "A"}</Avatar>}
                label={storedUser.name || "Admin"}
                variant="outlined"
                sx={{ borderColor: "rgba(226, 232, 240, 0.9)", fontWeight: 600 }}
              />
              <Tooltip title="Logout">
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: "#64748b",
                    bgcolor: "rgba(100, 116, 139, 0.08)",
                    "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Sidebar Drawer */}
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: [2],
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {open ? (
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: "hidden", pr: 0.5 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    minWidth: 34,
                    borderRadius: 2.5,
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    color: "#fff",
                  }}
                >
                  U
                </Box>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    fontSize: "0.92rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  Usama Saeed Tyre Shop
                </Typography>
              </Stack>
            ) : (
              <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    color: "#fff",
                  }}
                >
                  U
                </Box>
              </Box>
            )}

            {open && (
              <IconButton onClick={toggleDrawer} sx={{ color: "#94a3b8", ml: 0.5 }}>
                <ChevronLeftIcon />
              </IconButton>
            )}
          </Toolbar>

          {/* Nav List */}
          <Box sx={{ p: 1.25, flexGrow: 1, overflowX: "hidden" }}>
            {navItems.map((item) => {
              const active = render === item.id;
              return (
                <Tooltip key={item.id} title={!open ? item.label : ""} placement="right" arrow>
                  <ListItemButton
                    onClick={item.action}
                    sx={{
                      borderRadius: 2.5,
                      mb: 0.5,
                      py: 1.1,
                      px: open ? 1.75 : 1.5,
                      bgcolor: active ? "rgba(79, 70, 229, 0.2)" : "transparent",
                      color: active ? "#ffffff" : "#94a3b8",
                      borderLeft: active ? "3px solid #6366f1" : "3px solid transparent",
                      transition: "all 0.15s ease",
                      overflow: "hidden",
                      "&:hover": {
                        bgcolor: active ? "rgba(79, 70, 229, 0.28)" : "rgba(255, 255, 255, 0.05)",
                        color: "#ffffff",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: open ? 38 : "auto",
                        color: active ? "#818cf8" : "#64748b",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.label}
                        sx={{ minWidth: 0, overflow: "hidden", my: 0 }}
                        primaryTypographyProps={{
                          fontWeight: active ? 700 : 500,
                          fontSize: "0.875rem",
                          noWrap: true,
                          textOverflow: "ellipsis",
                          overflow: "hidden",
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </Box>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

          {/* User Profile Mini Footer */}
          {open && (
            <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "#4f46e5", width: 36, height: 36 }}>
                {storedUser.name ? storedUser.name[0] : "A"}
              </Avatar>
              <Box sx={{ overflow: "hidden", flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#ffffff" }} noWrap>
                  {storedUser.name || "Administrator"}
                </Typography>
                <Typography variant="caption" sx={{ color: "#64748b" }} noWrap>
                  {storedUser.email || "admin@store.com"}
                </Typography>
              </Box>
            </Box>
          )}
        </Drawer>

        {/* Main Content Viewport */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
            pt: 10,
            px: { xs: 2, md: 4 },
            pb: 4,
          }}
        >
          <Container maxWidth="xl" disableGutters>
            <Grid container spacing={0}>
              <Grid item xs={12}>
                {(render === "Overview" || render === "") && <Overview setRender={setRender} />}
                {render === "Companies" && <CompanyForm />}
                {render === "Customer" && <CustomerForm />}
                {render === "Category" && <Catagory />}
                {render === "AddStock" && <AddStock />}
                {render === "Purchases" && <PurchaseInvoice />}
                {render === "Party" && <Parties />}
                {render === "Sales" && <SalesForm setRender={setRender} />}
                {render === "AccReceivable" && <AccReceivable />}
                {render === "Expenses" && <Expenses />}
                {render === "StaffSalary" && <StaffSalary />}
                {render === "DailyRegister" && <DailyRegister setRender={setRender} />}
                {render === "SalesReturn" && <SalesReturn setRender={setRender} />}
                {render === "BankAccounts" && <BankAccounts />}
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default DashboardContent;
