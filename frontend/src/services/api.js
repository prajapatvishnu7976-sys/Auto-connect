import axios from "axios";

const API = axios.create({
  baseURL: "https://auto-connect-htzc.onrender.com/api",
});

// Har request mein token lagao
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;