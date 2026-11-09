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
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import TableData from "./TableData";
import { useDispatch, useSelector } from "react-redux";
import {
  createCompanyRecord,
  getAllCompanyRecord,
  updateCompanyRecord,
  deleteCompanyRecord,
} from "../features/Data/CompanySlice";

export default function CompanyForm() {
  const dispatch = useDispatch();
  const { header = [], data = [] } = useSelector((state) => state.company);
  const [searchValue, setSearchValue] = useState("");
  const [company, setCompany] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    dispatch(getAllCompanyRecord());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company.action) {
      await dispatch(createCompanyRecord(company));
      dispatch(getAllCompanyRecord());
      Clear();
    } else if (company.action === "edit") {
      await dispatch(updateCompanyRecord(company));
      dispatch(getAllCompanyRecord());
      Clear();
    } else if (company.action === "delete") {
      await dispatch(deleteCompanyRecord(company.id));
      dispatch(getAllCompanyRecord());
      Clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchValue(value);
    } else {
      setCompany({ ...company, [name]: value });
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchValue.trim()) return data;
    const q = searchValue.toLowerCase();
    return data.filter((item) => {
      const name = String(item[1] || "").toLowerCase();
      const phone = String(item[2] || "").toLowerCase();
      const address = String(item[3] || "").toLowerCase();
      return name.includes(q) || phone.includes(q) || address.includes(q);
    });
  }, [data, searchValue]);

  const Clear = () => {
    setCompany({ name: "", phone: "", address: "" });
    setSearchValue("");
  };

  const isEditing = company.action === "edit";
  const isDeleting = company.action === "delete";

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
                  bgcolor: "rgba(79, 70, 229, 0.1)",
                  color: "#4f46e5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BusinessRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Supplier & Vendor Companies
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage registered companies, vendor contact information, and supplier addresses
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Chip label={`${data.length} Registered`} color="primary" variant="outlined" size="small" />
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
            {isEditing ? "Edit Supplier Record" : isDeleting ? "Delete Supplier Record" : "Register Tyre Supplier / Company"}
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                required
                id="name"
                label="Company Name"
                variant="outlined"
                size="small"
                name="name"
                value={company.name}
                onChange={handleChange}
                placeholder="e.g. Acme Supplies Ltd."
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
                value={company.phone}
                onChange={handleChange}
                placeholder="03001234567"
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                required
                id="address"
                label="Office Address"
                variant="outlined"
                size="small"
                name="address"
                value={company.address}
                onChange={handleChange}
                placeholder="Street, City, Postal Code"
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
                    Register Supplier
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Search Bar & Table Header */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Company Directory
          </Typography>
          <TextField
            size="small"
            name="search"
            value={searchValue}
            onChange={handleChange}
            placeholder="Search by name, phone, or address..."
            sx={{ minWidth: { xs: "100%", sm: 320 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Data Table */}
        <TableData
          data={filteredData}
          header={header}
          setCompany={setCompany}
        />
      </CardContent>
    </Card>
  );
}
