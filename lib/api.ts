import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://dummyjson.com",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Inject Authorization header from session cookie/localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const raw =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("user_session="))
          ?.split("=")?.[1];
      if (raw) {
        const session = JSON.parse(decodeURIComponent(raw));
        if (session?.accessToken) {
          config.headers["Authorization"] = `Bearer ${session.accessToken}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Global 401 handler — clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      document.cookie =
        "user_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      localStorage.removeItem("user_session");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);