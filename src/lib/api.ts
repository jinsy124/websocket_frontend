import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ======================
// 🔐 AUTH APIs
// ======================

export const api = {

  async login(email: string, password: string) {
    try {
      const res = await apiClient.post("/auth/login", {
        email,
        password,
      });

      return { data: res.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.response?.data?.detail || "Login failed" };
    }
  },

  async register(name: string, email: string, password: string) {
    try {
      const res = await apiClient.post("/auth/register", {
        name,
        email,
        password,
      });

      return { data: res.data, error: null };
    } catch (err: any) {
      return { data: null, error: err.response?.data?.detail || "Register failed" };
    }
  },

  async getUserMe() {
    try {
      const res = await apiClient.get("/users/me");
      return { data: res.data, error: null };
    } catch (err: any) {
      return { data: null, error: "Unauthorized" };
    }
  },

};
