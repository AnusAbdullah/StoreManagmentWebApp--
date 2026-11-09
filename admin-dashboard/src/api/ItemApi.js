import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createItem = (item) => {
  console.log("Called" + item.name);
  return axios.post(`${url}/item`, item);
};

export const getAllItems = () => axios.get(`${url}/item/all`);

export const updateItem = (item) => axios.patch(`${url}/item/update`, item);

export const deleteItem = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/item/${id}`);
};
