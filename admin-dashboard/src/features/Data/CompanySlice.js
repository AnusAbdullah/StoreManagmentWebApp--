import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/CompanyApi.js";

const initialState = {
  id: "",
  companyName: "",
  phone: "",
  address: "",
  header: ["Id", "Company Name", "Phone", "Address"],
  data: [],
};

export const createCompanyRecord = createAsyncThunk(
  "company/createCompanyRecord",
  async (company) => {
    const { data } = await api.createCompany(company);
    return data;
  }
);

export const getAllCompanyRecord = createAsyncThunk(
  "company/getAllCompanyRecord",
  async () => {
    const { data } = await api.getCompanies();
    return data;
  }
);

export const updateCompanyRecord = createAsyncThunk(
  "company/updateCompanyRecord",
  async (company) => {
    const { data } = await api.editCompany(company);
    return data;
  }
);

export const deleteCompanyRecord = createAsyncThunk(
  "company/deleteCompanyRecord",
  async (id) => {
    console.log(`slice delete ${id}`);
    await api.deleteCompany(id);
    return id;
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {},
  extraReducers: {
    [createCompanyRecord.fulfilled]: (state, { payload }) => {
      var data = payload.map((item) => [
        item.id,
        item.name,
        item.phone.toString(),
        item.address,
      ]);
      console.log(data + "company");
      state.data = data;
    },
    [getAllCompanyRecord.fulfilled]: (state, { payload }) => {
      var data = payload.map((item) => [
        item.id,
        item.name,
        item.phone.toString(),
        item.address,
      ]);
      console.log(data + "company");
      state.data = data;
    },
    [updateCompanyRecord]: (state, { payload }) => {
      var data = payload.map((item) => [
        item.id,
        item.name,
        item.phone.toString(),
        item.address,
      ]);
      state.data = state.data.map((item) =>
        item.id === data.id ? data : item
      );
      console.log(`data changed ${state.data}`);
    },
    [deleteCompanyRecord]: (state, { payload }) => {
      state.data = state.data.filter((item) => item.id !== payload);
      console.log(`data changed ${state.data}`);
    },
  },
});

// export const { getCompanies } = companySlice.actions;

export default companySlice.reducer;
