import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createCategory = (category) => {
  console.log("Called" + category.name);
  return axios.post(`${url}/catagory`, category);
};

export const getCategories = () => axios.get(`${url}/catagory/all`);

export const editCategory = (category) =>
  axios.patch(`${url}/catagory/update`, category);

export const deleteCategory = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/catagory/${id}`);
};
