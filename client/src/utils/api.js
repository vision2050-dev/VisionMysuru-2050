import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("juryzaToken") ||
      localStorage.getItem("adminToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers["x-auth-token"] = token;
    }

    const userEmail = localStorage.getItem("juryzaEmail");
    if (userEmail) {
      config.headers["x-user-email"] = userEmail;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
