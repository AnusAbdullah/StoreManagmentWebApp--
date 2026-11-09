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
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CustomerTable from "./CustomerTable";
import { useDispatch, useSelector } from "react-redux";
import {
  createCustomerRecord,
  getAllCustomerRecord,
  updateCustomerRecord,
  deleteCustomerRecord,
} from "../features/Data/CustomerSlice";

export default function CustomerForm() {
  const dispatch = useDispatch();
  const { header = [], data = [] } = useSelector((state) => state.customer);
  const [searchValue, setSearchValue] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    cnic: "",
  });

  useEffect(() => {
    dispatch(getAllCustomerRecord());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.action) {
      await dispatch(createCustomerRecord(customer));
      dispatch(getAllCustomerRecord());
      Clear();
    } else if (customer.action === "edit") {
      await dispatch(updateCustomerRecord(customer));
      dispatch(getAllCustomerRecord());
      Clear();
    } else if (customer.action === "delete") {
      await dispatch(deleteCustomerRecord(customer.id));
      dispatch(getAllCustomerRecord());
      Clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchValue(value);
    } else {
      setCustomer({ ...customer, [name]: value });
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchValue.trim()) return data;
    const q = searchValue.toLowerCase();
    return data.filter((item) => {
      const name = String(item[1] || "").toLowerCase();
      const phone = String(item[2] || "").toLowerCase();
      const address = String(item[3] || "").toLowerCase();
      const cnic = String(item[4] || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || address.includes(q) || cnic.includes(q);
    });
  }, [data, searchValue]);

  const Clear = () => {
    setCustomer({ name: "", phone: "", address: "", cnic: "" });
    setSearchValue("");
  };

  const isEditing = customer.action === "edit";
  const isDeleting = customer.action === "delete";

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
                  width: 40,
                  height: 40,
                  borderRadius: 2.5,
                  bgcolor: "rgba(6, 182, 212, 0.1)",
                  color: "#06b6d4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Customer Directory
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage client accounts, phone contacts, national IDs (CNIC), and addresses
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Chip label={`${data.length} Customers`} color="info" variant="outlined" size="small" />
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
            {isEditing ? "Edit Customer Record" : isDeleting ? "Delete Customer Record" : "Register New Customer"}
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                id="name"
                label="Full Name"
                variant="outlined"
                size="small"
                name="name"
                value={customer.name}
                onChange={handleChange}
                placeholder="John Doe"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                id="phone"
                label="Phone Number"
                variant="outlined"
                size="small"
                name="phone"
                type="number"
                value={customer.phone}
                onChange={handleChange}
                placeholder="03001234567"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                id="cnic"
                label="CNIC / National ID"
                variant="outlined"
                size="small"
                name="cnic"
                value={customer.cnic}
                onChange={handleChange}
                placeholder="42101-1234567-1"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                required
                id="address"
                label="Residential Address"
                variant="outlined"
                size="small"
                name="address"
                value={customer.address}
                onChange={handleChange}
                placeholder="City, Area"
              />
            </Grid>

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
                      Save Changes
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
                      Confirm Delete
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
                    Register Customer
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Search Bar & Table Header */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Registered Customers List
          </Typography>
          <TextField
            size="small"
            name="search"
            value={searchValue}
            onChange={handleChange}
            placeholder="Search by name, phone, CNIC, or address..."
            sx={{ minWidth: { xs: "100%", sm: 340 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Customer Data Table */}
        <CustomerTable
          data={filteredData}
          header={header}
          setCustomer={setCustomer}
        />
      </CardContent>
    </Card>
  );
}
