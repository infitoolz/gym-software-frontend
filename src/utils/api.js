import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

let accessToken = null;

let onAuthFailure = null;
let onTokenRefreshed = null;

const clearAuthAndRedirect = () => {
  clearTokens();

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

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

export function clearTokens() {
  accessToken = null;
}

export function attachAuthHandlers({ handleAuthFailure, handleTokenRefreshed } = {}) {
  onAuthFailure = handleAuthFailure || null;
  onTokenRefreshed = handleTokenRefreshed || null;
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    getAccessToken() ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const url = originalRequest.url || "";

    const isLogin = url.includes("/auth/login");
    const isRefresh = url.includes("/auth/refresh");
    const isAuthFailure = status === 401;

    if (isAuthFailure && !originalRequest._retry && !isLogin && !isRefresh) {
      originalRequest._retry = true;

      try {
        const refreshResponse = await api.post("/auth/refresh", {});

        const newAccessToken =
          refreshResponse.data?.accessToken ||
          refreshResponse.data?.token;

        if (!newAccessToken) {
          throw new Error("No access token returned during refresh");
        }

        setAccessToken(newAccessToken);
        localStorage.setItem("token", newAccessToken);
        localStorage.setItem("accessToken", newAccessToken);

        if (typeof onTokenRefreshed === "function") {
          onTokenRefreshed(refreshResponse.data);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        if (typeof onAuthFailure === "function") {
          onAuthFailure(refreshError);
        }

        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    if (isAuthFailure && !isLogin && !isRefresh) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default api;


