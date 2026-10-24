import axios from "axios";

// Determine appropriate API Base URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    // In dev mode, target backend port 5001 on the active hostname (localhost, 127.0.0.1, or LAN)
    if (import.meta.env.DEV) {
      const hostname = window.location.hostname || "localhost";
      return `http://${hostname}:5001`;
    }
    // On deployed production without custom VITE_API_URL, use relative origin
    return "";
  }

  return "http://localhost:5001";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 4000, // 4s timeout to trigger resilient client storage fallback quickly
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
