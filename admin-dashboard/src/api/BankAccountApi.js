import axios from "axios";

const url = process.env.REACT_APP_API_URL || "http://localhost:4001";

export const getBankAccounts = () => axios.get(`${url}/bank-accounts`);
export const getAllBankAccounts = getBankAccounts;

export const getBankAccountById = (id) => axios.get(`${url}/bank-accounts/${id}`);

export const createBankAccount = (accountData) => axios.post(`${url}/bank-accounts`, accountData);

export const updateBankAccount = (id, accountData) => axios.put(`${url}/bank-accounts/${id}`, accountData);

export const deleteBankAccount = (id) => axios.delete(`${url}/bank-accounts/${id}`);

export const depositWithdrawManual = (txData) => axios.post(`${url}/bank-accounts/manual-transaction`, txData);

export const transferBetweenBanks = (transferData) => axios.post(`${url}/bank-accounts/transfer`, transferData);

export const getBankTransactions = (params = {}) => axios.get(`${url}/bank-accounts/transactions`, { params });

