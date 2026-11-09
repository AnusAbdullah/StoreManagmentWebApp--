import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/CustomerApi.js";

const initialState = {
  id: "",
  customerName: "",
  cnic: "",
  address: "",
  phone: "",
  header: ["Id", "Customer Name", "Phone", "Address", "Cnic"],
  data: [],
  rawCustomers: [],
};

export const createCustomerRecord = createAsyncThunk(
  "customer/createCustomerRecord",
  async (customer) => {
    const { data } = await api.createCustomer(customer);
    return data;
  }
);

export const getAllCustomerRecord = createAsyncThunk(
  "customer/getAllCustomerRecord",
  async () => {
    const { data } = await api.getCustomers();
    return data;
  }
);

export const updateCustomerRecord = createAsyncThunk(
  "customer/updateCustomerRecord",
  async (customer) => {
    const { data } = await api.editCustomer(customer);
    return data;
  }
);

export const deleteCustomerRecord = createAsyncThunk(
  "customer/deleteCustomerRecord",
  async (id) => {
    await api.deleteCustomer(id);
    return id;
  }
);

const mapCustomersToRows = (customers) => {
  return customers.map((c) => [
    c.id,
    c.name || "",
    c.phone ? c.phone.toString() : "",
    c.address || "",
    c.cnic || "",
  ]);
};

const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createCustomerRecord.fulfilled, (state, { payload }) => {
        state.rawCustomers = Array.isArray(payload) ? payload : [];
        state.data = mapCustomersToRows(state.rawCustomers);
      })
      .addCase(getAllCustomerRecord.fulfilled, (state, { payload }) => {
        state.rawCustomers = Array.isArray(payload) ? payload : [];
        state.data = mapCustomersToRows(state.rawCustomers);
      })
      .addCase(updateCustomerRecord.fulfilled, (state, { payload }) => {
        if (payload && payload.id) {
          state.rawCustomers = state.rawCustomers.map((c) =>
            c.id === payload.id ? payload : c
          );
          state.data = mapCustomersToRows(state.rawCustomers);
        }
      })
      .addCase(deleteCustomerRecord.fulfilled, (state, { payload }) => {
        state.rawCustomers = state.rawCustomers.filter((c) => c.id !== payload);
        state.data = mapCustomersToRows(state.rawCustomers);
      });
  },
});

// export const { getCompanies } = companySlice.actions;

export default customerSlice.reducer;
