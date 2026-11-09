import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createAccRec = (accRec) => {
  console.log("Called" + accRec.name);
  return axios.post(`${url}/accRec`, accRec);
};
export const getAccRec = () => axios.get(`${url}/accRec/all`);
export const editAccRec = (id, accRec) =>
  axios.put(`${url}/accRec/${id}`, accRec);
export const deleteAccRec = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/accRec/${id}`);
};