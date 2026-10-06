import axios from "axios";

const API_URL = "http://localhost:8082/api/drift";

export const getPortfolioDriftHistory = async (portfolioId) => {
  const userId = localStorage.getItem("userId");
  const response = await axios.get(`${API_URL}/history/${portfolioId}/${userId}`);
  return response.data.data;
};

export const runPortfolioDriftCheck = async (portfolioId, userId = localStorage.getItem("userId")) => {
  if (!userId) throw new Error("Sign in before running a drift check.");
  const response = await axios.get(`${API_URL}/calculate/${portfolioId}/${userId}`);
  return response.data;
};
