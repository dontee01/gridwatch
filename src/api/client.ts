import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

import { API_URL } from "../constants/config";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "../storage/auth.storage";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;

let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeToTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function notifyTokenRefresh(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));

  refreshSubscribers = [];
}

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await clearTokens();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeToTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const responseData = refreshResponse.data;

      const data = responseData?.data ?? responseData;

      const newAccessToken = data.accessToken;

      const newRefreshToken = data.refreshToken;

      if (!newAccessToken) {
        throw new Error("Refresh response did not contain an access token.");
      }

      await saveTokens(newAccessToken, newRefreshToken ?? refreshToken);

      notifyTokenRefresh(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      await clearTokens();

      refreshSubscribers = [];

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export { api };

