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
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import CategoryTable from "./CatagoryTable";
import { useDispatch, useSelector } from "react-redux";
import {
  createCategoryRecord,
  getAllCategoryRecord,
  updateCategoryRecord,
  deleteCategoryRecord,
} from "../features/Data/CatagorySlice";

export default function Catagory() {
  const dispatch = useDispatch();
  const { header = [], data = [] } = useSelector((state) => state.category);
  const [searchValue, setSearchValue] = useState("");
  const [category, setCategory] = useState({
    name: "",
  });

  useEffect(() => {
    dispatch(getAllCategoryRecord());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category.action) {
      await dispatch(createCategoryRecord(category));
      dispatch(getAllCategoryRecord());
      Clear();
    } else if (category.action === "edit") {
      await dispatch(updateCategoryRecord(category));
      dispatch(getAllCategoryRecord());
      Clear();
    } else if (category.action === "delete") {
      await dispatch(deleteCategoryRecord(category.id));
      dispatch(getAllCategoryRecord());
      Clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchValue(value);
    } else {
      setCategory({ ...category, [name]: value });
    }
  };

  const filteredData = React.useMemo(() => {
    if (!searchValue.trim()) return data;
    const q = searchValue.toLowerCase();
    return data.filter((item) => {
      const name = String(item[1] || "").toLowerCase();
      return name.includes(q);
    });
  }, [data, searchValue]);

  const Clear = () => {
    setCategory({ name: "" });
    setSearchValue("");
  };

  const isEditing = category.action === "edit";
  const isDeleting = category.action === "delete";

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
                  bgcolor: "rgba(139, 92, 246, 0.1)",
                  color: "#8b5cf6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CategoryRoundedIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Vehicle & Tyre Categories
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Manage vehicle types and tyre classifications (Passenger Car, SUV / 4x4, LTR, TBR, Motorcycle, EV) that automatically sync across Stock-In and Inventory
                </Typography>
              </Box>
            </Stack>
          </Box>
          <Chip label={`${data.length} Vehicle Categories`} color="secondary" variant="outlined" size="small" />
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
            {isEditing ? "Edit Category Name" : isDeleting ? "Delete Category" : "Add New Vehicle / Tyre Category"}
          </Typography>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                required
                id="name"
                label="Vehicle / Tyre Category Name"
                variant="outlined"
                size="small"
                name="name"
                value={category.name}
                onChange={handleChange}
                placeholder="e.g. Passenger Car (PCR), SUV / 4x4, Light Truck, Agricultural, EV Tyres..."
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
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
                    Add Category
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Search Bar & Table Header */}
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Active Categories List
          </Typography>
          <TextField
            size="small"
            name="search"
            value={searchValue}
            onChange={handleChange}
            placeholder="Search categories..."
            sx={{ minWidth: { xs: "100%", sm: 300 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Categories Table */}
        <CategoryTable
          data={filteredData}
          header={header}
          setCategory={setCategory}
        />
      </CardContent>
    </Card>
  );
}
