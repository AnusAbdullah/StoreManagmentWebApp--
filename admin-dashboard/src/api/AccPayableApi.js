import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createAccPay = (accPay) => axios.post(`${url}/accPay`, accPay);
export const getAccPay = () => axios.get(`${url}/accPay/all`);
export const editAccPay = (id, accPay) => axios.put(`${url}/accPay/${id}`, accPay);
export const deleteAccPay = (id) => axios.delete(`${url}/accPay/${id}`);
