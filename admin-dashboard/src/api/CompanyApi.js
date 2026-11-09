import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createCompany = (company) => {
  console.log("Called" + company.name);
  return axios.post(`${url}/company`, company);
};
export const getCompanies = () => axios.get(`${url}/company/all`);
export const editCompany = (company) =>
  axios.patch(`${url}/company/update`, company);
export const deleteCompany = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/company/${id}`);
};
