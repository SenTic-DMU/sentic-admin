import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosError } from "axios";

const TOKEN_STORAGE_KEY = "admin_access_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export function attachAuthHeader(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
}

export function handleAuthError(
  error: AxiosError,
  redirect: () => void = () => {
    window.location.href = "/login";
  }
): Promise<never> {
  if (error.response?.status === 401) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    redirect();
  }
  return Promise.reject(error);
}

apiClient.interceptors.request.use(attachAuthHeader);
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleAuthError(error)
);
