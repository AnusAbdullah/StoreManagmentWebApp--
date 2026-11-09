import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/ItemApi.js"; // Updated to use ItemApi.js

const initialState = {
  id: "",
  name: "",
  brand: "",
  pattern: "",
  size: "",
  category: "",
  origin: "",
  dot: "",
  costPrice: 0,
  price: 0,
  quantity: 0,
  header: [
    "Id",
    "Brand",
    "Model / Pattern",
    "Size",
    "Category",
    "Origin",
    "DOT",
    "Cost (PKR)",
    "Sale (PKR)",
    "Stock Qty",
  ],
  data: [],
  rawItems: [],
};

export const createItemRecord = createAsyncThunk(
  "stock/createItemRecord",
  async (item) => {
    const { data } = await api.createItem(item);
    return data;
  }
);

export const getAllItemRecord = createAsyncThunk(
  "stock/getAllItemRecord",
  async () => {
    const { data } = await api.getAllItems();
    return data;
  }
);

export const updateItemRecord = createAsyncThunk(
  "stock/updateItemRecord",
  async (item) => {
    const { data } = await api.updateItem(item);
    return data;
  }
);

export const deleteItemRecord = createAsyncThunk(
  "stock/deleteItemRecord",
  async (id) => {
    await api.deleteItem(id);
    return id;
  }
);

const mapItemsToRows = (items) => {
  return items.map((item) => [
    item.id,
    item.brand || item.name || "",
    item.pattern || item.name || "",
    item.size || "",
    item.category || item.catagory || "Passenger Car",
    item.origin || "-",
    item.dot || "-",
    Number(item.costPrice || 0),
    Number(item.price || 0),
    Number(item.quantity || 0),
  ]);
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createItemRecord.fulfilled, (state, { payload }) => {
        state.rawItems = Array.isArray(payload) ? payload : [];
        state.data = mapItemsToRows(state.rawItems);
      })
      .addCase(getAllItemRecord.fulfilled, (state, { payload }) => {
        state.rawItems = Array.isArray(payload) ? payload : [];
        state.data = mapItemsToRows(state.rawItems);
      })
      .addCase(updateItemRecord.fulfilled, (state, { payload }) => {
        if (payload && payload.id) {
          state.rawItems = state.rawItems.map((item) =>
            item.id === payload.id ? payload : item
          );
          state.data = mapItemsToRows(state.rawItems);
        }
      })
      .addCase(deleteItemRecord.fulfilled, (state, { payload }) => {
        state.rawItems = state.rawItems.filter((item) => item.id !== payload);
        state.data = mapItemsToRows(state.rawItems);
      });
  },
});

export default stockSlice.reducer;
