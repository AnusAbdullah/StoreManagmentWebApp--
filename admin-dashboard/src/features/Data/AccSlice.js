import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/AccReceivableApi";

const initialState = {
  header: ["Id", "Customer / Ledger", "Received Till Now", "Today Payment", "Remaining Balance", "Created Date"],
  data: [],
  loading: false,
};

export const createAccRecRecord = createAsyncThunk(
  "accRec/createAccRecRecord",
  async (record) => {
    const { data } = await api.createAccRec(record);
    return data;
  }
);

export const getAllAccRecRecord = createAsyncThunk(
  "accRec/getAllAccRecRecord",
  async () => {
    const { data } = await api.getAccRec();
    return data;
  }
);

export const updateAccRecRecord = createAsyncThunk(
  "accRec/updateAccRecRecord",
  async ({ id, ...record }) => {
    const { data } = await api.editAccRec(id, record);
    return data;
  }
);

export const deleteAccRecRecord = createAsyncThunk(
  "accRec/deleteAccRecRecord",
  async (id) => {
    await api.deleteAccRec(id);
    return id;
  }
);

const accSlice = createSlice({
  name: "accRec",
  initialState: {
    ...initialState,
    rawRecords: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllAccRecRecord.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllAccRecRecord.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.rawRecords = Array.isArray(payload) ? payload : [];
        if (Array.isArray(payload)) {
          state.data = payload.map((item) => [
            item.id,
            item.cname || "Walk-in Customer",
            item.receivedTillNow != null ? `PKR ${Number(item.receivedTillNow).toLocaleString()}` : "PKR 0",
            item.receiveToday != null ? `PKR ${Number(item.receiveToday).toLocaleString()}` : "PKR 0",
            item.remainingAmount != null ? `PKR ${Number(item.remainingAmount).toLocaleString()}` : "PKR 0",
            item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent",
          ]);
        }
      })
      .addCase(getAllAccRecRecord.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createAccRecRecord.fulfilled, (state, { payload }) => {
        // Handled via re-fetch
      })
      .addCase(updateAccRecRecord.fulfilled, (state, { payload }) => {
        // Handled via re-fetch
      })
      .addCase(deleteAccRecRecord.fulfilled, (state, { payload }) => {
        state.data = state.data.filter((row) => row[0] !== payload);
      });
  },
});

export default accSlice.reducer;
