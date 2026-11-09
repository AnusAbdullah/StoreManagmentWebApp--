import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createStaff = (staff) => axios.post(`${url}/staff`, staff);
export const getAllStaff = () => axios.get(`${url}/staff/all`);
export const updateStaff = (id, staff) => axios.put(`${url}/staff/${id}`, staff);
export const deleteStaff = (id) => axios.delete(`${url}/staff/${id}`);

export const createSalaryPayout = (payout) => axios.post(`${url}/staff/payout`, payout);
export const getAllSalaryPayouts = () => axios.get(`${url}/staff/payout/all`);
export const deleteSalaryPayout = (id) => axios.delete(`${url}/staff/payout/${id}`);

const staffApi = {
  createStaff,
  getAllStaff,
  updateStaff,
  deleteStaff,
  createSalaryPayout,
  getAllSalaryPayouts,
  deleteSalaryPayout,
};

export default staffApi;

