import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const getAllSalesReturns = () => axios.get(`${url}/sales-return`);
export const createSalesReturn = (payload) => axios.post(`${url}/sales-return`, payload);
export const deleteSalesReturn = (id) => axios.delete(`${url}/sales-return/${id}`);

const salesReturnApi = {
  getAllSalesReturns,
  createSalesReturn,
  deleteSalesReturn,
};

export default salesReturnApi;

