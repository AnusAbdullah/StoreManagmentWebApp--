import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/PurchaseApi.js";

const initialState = {
  data: [],
  loading: false,
  error: null,
};

export const createPurchaseRecord = createAsyncThunk(
  "purchases/createPurchaseRecord",
  async (purchaseData, thunkAPI) => {
    const { data } = await api.createPurchase(purchaseData);
    return data;
  }
);

export const getAllPurchasesRecord = createAsyncThunk(
  "purchases/getAllPurchasesRecord",
  async (_, thunkAPI) => {
    const { data } = await api.getAllPurchases();
    return data;
  }
);

export const deletePurchaseRecord = createAsyncThunk(
  "purchases/deletePurchaseRecord",
  async (id, thunkAPI) => {
    await api.deletePurchase(id);
    return id;
  }
);

const purchaseSlice = createSlice({
  name: "purchases",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllPurchasesRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllPurchasesRecord.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.data = Array.isArray(payload) ? payload : [];
      })
      .addCase(getAllPurchasesRecord.rejected, (state, { error }) => {
        state.loading = false;
        state.error = error.message;
      })
      .addCase(createPurchaseRecord.fulfilled, (state, { payload }) => {
        state.data = [payload, ...state.data];
      })
      .addCase(deletePurchaseRecord.fulfilled, (state, { payload }) => {
        state.data = state.data.filter((item) => item.id !== payload);
      });
  },
});

export default purchaseSlice.reducer;
