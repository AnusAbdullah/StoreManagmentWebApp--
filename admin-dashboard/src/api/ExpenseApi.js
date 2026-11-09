import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createExpense = (expense) => axios.post(`${url}/expense`, expense);
export const getAllExpenses = () => axios.get(`${url}/expense/all`);
export const updateExpense = (id, expense) => axios.put(`${url}/expense/${id}`, expense);
export const deleteExpense = (id) => axios.delete(`${url}/expense/${id}`);

const expenseApi = {
  createExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
};

export default expenseApi;

