import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const createParty = (party) => {
  console.log("Called" + party.name);
  return axios.post(`${url}/party`, party);
};

export const getParties = () => axios.get(`${url}/party/all`);

export const editParty = (party) => axios.patch(`${url}/party/update`, party);

export const deleteParty = (id) => {
  console.log(`api delete ${id}`);
  return axios.delete(`${url}/party/${id}`);
};
