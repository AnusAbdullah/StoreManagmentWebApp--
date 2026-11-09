import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createSales = (sale) => {
  return axios.post(`${url}/sale`, sale);
};

export const getAllSales = () => {
  return axios.get(`${url}/sale/all`);
};

export const deleteSalesRecord = (id) => {
  return axios.delete(`${url}/sale/${id}`);
};
