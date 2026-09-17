import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

const clearAuthAndRedirect = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("email");
  localStorage.removeItem("name");

  if (window.location.pathname !== "/sign-in") {
    window.location.href = "/sign-in";
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;


