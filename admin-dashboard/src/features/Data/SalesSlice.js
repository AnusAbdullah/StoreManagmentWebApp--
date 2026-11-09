import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/SalesApi.js";

const initialState = {
  name: "",
  contact: "",
  vehicleNo: "",
  vehicleModel: "",
  data: [],
  totalBill: 0,
  recievedAmount: 0,
  remainingAmount: 0,
  status: "cash",
  salesHistory: [],
  loading: false,
};

export const createSales = createAsyncThunk(
  "Sales/createSales",
  async (customPayload, thunkAPI) => {
    const state = thunkAPI.getState().sale;
    const salePayload = customPayload || {
      cname: state.name || "Walk-in Customer",
      vehicleNo: state.vehicleNo || "",
      vehicleModel: state.vehicleModel || "",
      data: state.data,
      totalBill: Number(state.totalBill || 0),
      receivedAmount: Number(state.recievedAmount || 0),
      remainingAmount: Number(state.remainingAmount || 0),
      status: state.status || "cash",
    };
    const { data } = await api.createSales(salePayload);
    return data;
  }
);

export const getAllSalesRecords = createAsyncThunk(
  "Sales/getAllSalesRecords",
  async (_, thunkAPI) => {
    const { data } = await api.getAllSales();
    return data;
  }
);

export const deleteSalesRecord = createAsyncThunk(
  "Sales/deleteSalesRecord",
  async (id, thunkAPI) => {
    await api.deleteSalesRecord(id);
    return id;
  }
);

const saleSlice = createSlice({
  name: "sale",
  initialState,
  reducers: {
    addSales: (state, { payload }) => {
      const itemRow = payload[0];
      state.data.push(itemRow);
      const price = Number(Array.isArray(itemRow) ? itemRow[2] : itemRow.price || 0);
      const qty = Number(Array.isArray(itemRow) ? itemRow[3] : itemRow.quantity || 0);
      state.totalBill += price * qty;
    },
    editSales: (state, { payload }) => {
      const isArr = Array.isArray(payload);
      const payloadId = isArr ? payload[4] : (payload.itemId || payload.id);
      const payloadName = isArr ? payload[0] : (payload.itemName || payload.name);

      state.data = state.data.map((row) => {
        const rowIsArr = Array.isArray(row);
        const rowId = rowIsArr ? row[4] : (row.itemId || row.id);
        const rowName = rowIsArr ? row[0] : (row.itemName || row.name);

        if (rowId && payloadId && rowId === payloadId) return payload;
        return rowName === payloadName ? payload : row;
      });

      state.totalBill = 0;
      state.data.forEach((row) => {
        const p = Number(Array.isArray(row) ? row[2] : row.price || 0);
        const q = Number(Array.isArray(row) ? row[3] : row.quantity || 0);
        state.totalBill += p * q;
      });
    },
    deleteSales: (state, { payload }) => {
      const isArr = Array.isArray(payload);
      const payloadId = isArr ? payload[4] : (payload.itemId || payload.id);
      const payloadName = isArr ? payload[0] : (payload.itemName || payload.name);

      state.data = state.data.filter((row) => {
        const rowIsArr = Array.isArray(row);
        const rowId = rowIsArr ? row[4] : (row.itemId || row.id);
        const rowName = rowIsArr ? row[0] : (row.itemName || row.name);

        if (rowId && payloadId && rowId === payloadId) return false;
        return rowName !== payloadName;
      });

      state.totalBill = 0;
      state.data.forEach((row) => {
        const p = Number(Array.isArray(row) ? row[2] : row.price || 0);
        const q = Number(Array.isArray(row) ? row[3] : row.quantity || 0);
        state.totalBill += p * q;
      });
    },
    checkOut: (state, { payload }) => {
      state.name = payload.name;
      state.contact = payload.contact || "";
      state.vehicleNo = payload.vehicleNo || "";
      state.vehicleModel = payload.vehicleModel || "";
      state.recievedAmount = Number(payload.recamount || 0);
      state.remainingAmount = Number(payload.remainingAmount || 0);
      state.status = payload.status || "cash";
    },
    resetCart: (state) => {
      state.data = [];
      state.totalBill = 0;
      state.recievedAmount = 0;
      state.remainingAmount = 0;
      state.name = "";
      state.contact = "";
      state.vehicleNo = "";
      state.vehicleModel = "";
      state.status = "cash";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSales.fulfilled, (state, { payload }) => {
        state.salesHistory = [payload, ...state.salesHistory];
        state.data = [];
        state.totalBill = 0;
        state.recievedAmount = 0;
        state.remainingAmount = 0;
        state.name = "";
        state.vehicleNo = "";
        state.vehicleModel = "";
        state.status = "cash";
      })
      .addCase(getAllSalesRecords.fulfilled, (state, { payload }) => {
        state.salesHistory = Array.isArray(payload) ? payload : [];
      })
      .addCase(deleteSalesRecord.fulfilled, (state, { payload }) => {
        state.salesHistory = state.salesHistory.filter((s) => s.id !== payload);
      });
  },
});

export const { addSales, editSales, deleteSales, checkOut, resetCart } = saleSlice.actions;

export default saleSlice.reducer;
