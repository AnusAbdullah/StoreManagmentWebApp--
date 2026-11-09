import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createPurchase = (purchase) => {
  return axios.post(`${url}/purchases`, purchase);
};

export const getAllPurchases = () => {
  return axios.get(`${url}/purchases/all`);
};

export const deletePurchase = (id) => {
  return axios.delete(`${url}/purchases/${id}`);
};
