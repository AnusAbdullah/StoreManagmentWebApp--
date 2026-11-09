import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const getDailyRegister = (date) =>
  axios.get(`${url}/daily-register`, { params: date ? { date } : {} });

export const updateOpeningBalance = (payload) =>
  axios.post(`${url}/daily-register/opening`, payload);

export const closeDailyRegister = (payload) =>
  axios.post(`${url}/daily-register/close`, payload);

export const reopenDailyRegister = (payload) =>
  axios.post(`${url}/daily-register/reopen`, payload);

const dailyRegisterApi = {
  getDailyRegister,
  updateOpeningBalance,
  closeDailyRegister,
  reopenDailyRegister,
};

export default dailyRegisterApi;

