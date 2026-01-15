import axios from "axios";
import { LocalStorage } from "quasar";

const api = axios.create({
  baseURL: "http://localhost:3000", // Adjust this URL based on your backend server
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from Quasar LocalStorage to every request (if present)
api.interceptors.request.use(
  (config) => {
    const token = LocalStorage.getItem("token");
    if (token) {
      // Backend currently expects the raw token in Authorization header
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
