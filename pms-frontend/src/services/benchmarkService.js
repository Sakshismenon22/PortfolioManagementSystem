import axios from "axios";

const API_URL = "http://localhost:8082/api/benchmark";

export const getNifty50History = async (from, to) => {
  const response = await axios.get(`${API_URL}/nifty50-history`, {
    params: { from, to },
  });
  return response.data?.data ?? [];
};
