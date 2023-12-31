import * as React from "react";
import { useState, useEffect } from "react";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import StockTable from "./StockTable.js"; // Updated to use StockTable
import Autocomplete from "@mui/material/Autocomplete";
import ComboBox from "react-responsive-combo-box";
import "react-responsive-combo-box/dist/index.css";
import { useDispatch, useSelector } from "react-redux";
import {
  createItemRecord, // Updated to use createItemRecord from stockSlice
  getAllItemRecord, // Updated to use getAllItemRecord from stockSlice
  updateItemRecord, // Updated to use updateItemRecord from stockSlice
  deleteItemRecord, // Updated to use deleteItemRecord from stockSlice
} from "../features/Data/StockSlice"; // Updated to use StockSlice

export default function StockForm() {
  const data1 = [];

  const dispatch = useDispatch();
  const [selectedCatagory, setSelectedCatagory] = useState("");
  const { header, data } = useSelector((state) => state.stock); // Updated to use "stock" instead of "customer"
  var catagories = useSelector((state) => state.category.data);
  const [searchValue, setSearchValue] = useState("");
  const [item, setItem] = useState({
    name: "",
    size: "",
    catagory: selectedCatagory, // Updated "catagory" to "category"
    price: "",
    quantity: "",
  });
  console.log(data1, catagories);
  for (var catagory1 of catagories) {
    console.log(catagory1[1]);
    data1.push(catagory1[1]);
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(`catagory = ${item.catagory}`);
    if (!item.action) {
      console.log(`item = ${item.catagory},${item.itemName} ${item}`);
      dispatch(createItemRecord(item)); // Updated to use createItemRecord from stockSlice
      setSelectedCatagory("");
      Clear();
    } else if (item.action === "edit") {
      console.log(item);
      dispatch(updateItemRecord(item)); // Updated to use updateItemRecord from stockSlice
      setSelectedCatagory("");
      dispatch(getAllItemRecord()); // Updated to use getAllItemRecord from stockSlice
      dispatch(getAllItemRecord()); // Updated to use getAllItemRecord from stockSlice
      Clear();
    } else {
      dispatch(deleteItemRecord(item.id)); // Updated to use deleteItemRecord from stockSlice
      setSelectedCatagory("");
      dispatch(getAllItemRecord()); // Updated to use getAllItemRecord from stockSlice
      dispatch(getAllItemRecord()); // Updated to use getAllItemRecord from stockSlice
      Clear();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "search") {
      setSearchValue(value);
    } else {
      setItem({ ...item, [name]: value }); // Updated to use "item" instead of "customer"
    }
  };

  const SearchStock = () => {
    return data.filter((item) => {
      return item[1].toLowerCase().includes(searchValue.toLowerCase());
    });
  };

  const Clear = () => {
    setItem({
      itemName: "",
      size: "",
      category: "",
      price: "",
      quantity: "",
    });
    setSearchValue("");
  };

  return (
    <Card sx={{ minWidth: 275, marginTop: 4 }}>
      <CardContent>
        <Typography variant="h6">Add New Item</Typography>{" "}
        {/* Updated the heading */}
        <form onSubmit={handleSubmit}>
          <TextField
            sx={{ marginRight: 5, marginTop: 2 }}
            id="outlined-basic"
            label="Item Name"
            variant="outlined"
            size="small"
            name="name" // Updated "name" to "itemName"
            value={item.name} // Updated "name" to "itemName"
            onChange={handleChange}
          />
          <TextField
            sx={{ marginRight: 5, marginTop: 2 }}
            id="outlined-basic"
            label="Size"
            variant="outlined"
            size="small"
            name="size"
            value={item.size}
            onChange={handleChange}
          />
          <ComboBox
            options={data1}
            enableAutocomplete
            placeholder="Catagory"
            name="catagory"
            onSelect={(option) => {
              console.log(`option = ${option}`);
              setItem({
                ...item,
                catagory: option,
              });
            }}
          />
          <TextField
            sx={{ marginRight: 5, marginTop: 2 }}
            id="outlined-basic"
            label="Price"
            variant="outlined"
            size="small"
            name="price"
            type="number"
            value={item.price}
            onChange={handleChange}
          />
          <TextField
            sx={{ marginRight: 5, marginTop: 2 }}
            id="outlined-basic"
            label="Quantity"
            variant="outlined"
            size="small"
            name="quantity"
            type="number"
            value={item.quantity}
            onChange={handleChange}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ marginRight: 5, marginTop: 2 }}
          >
            Add
          </Button>
          {item.action === "edit" && (
            <>
              <Button
                type="submit"
                variant="contained"
                sx={{ marginRight: 5, marginTop: 2 }}
              >
                Edit
              </Button>
              <Button
                variant="contained"
                sx={{ marginRight: 5, marginTop: 2 }}
                onClick={() => {
                  Clear();
                }}
              >
                Clear
              </Button>
            </>
          )}
          {item.action === "delete" && (
            <>
              <Button
                type="submit"
                variant="contained"
                sx={{ marginRight: 5, marginTop: 2 }}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                sx={{ marginRight: 5, marginTop: 2 }}
                onClick={() => {
                  Clear();
                }}
              >
                Clear
              </Button>
            </>
          )}
        </form>
        <TextField
          sx={{ marginRight: 5, marginTop: 2 }}
          id="outlined-basic"
          label="Search"
          variant="outlined"
          size="small"
          name="search"
          value={searchValue}
          onChange={handleChange}
        />
      </CardContent>
      <Divider sx={{ my: 1 }} />
      <CardContent sx={{ marginTop: 2 }}>
        <StockTable // Updated to use StockTable
          data={searchValue ? SearchStock() : data} // Updated to use SearchStock
          header={header}
          setItem={setItem} // Updated to use "item" instead of "customer"
        />
      </CardContent>
    </Card>
  );
}
