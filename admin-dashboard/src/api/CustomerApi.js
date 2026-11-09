import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createCustomer = (customer) => {
  console.log("Called" + customer.name);
  return axios.post(`${url}/customer`, customer);
};
export const getCustomers = () => axios.get(`${url}/customer/all`);
export const editCustomer = (customer) =>
  axios.patch(`${url}/customer/update`, customer);
export const deleteCustomer = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/customer/${id}`);
};
 