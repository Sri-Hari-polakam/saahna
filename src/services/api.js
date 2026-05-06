import axios from "axios";

const API_URL =
  import.meta.env?.VITE_API_URL ||
  process.env?.NEXT_PUBLIC_API_URL ||
  "https://saahna-production.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default api;
