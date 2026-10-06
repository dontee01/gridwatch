import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "gridwatch_access_token";
const REFRESH_TOKEN_KEY = "gridwatch_refresh_token";

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === "web") {
    // Web Fallback
    localStorage.removeItem(key);
  } else {
    // Native Mobile
    await SecureStore.deleteItemAsync(key);
  }
};

export const setItemAsync = async (
  key: string,
  value: string,
): Promise<void> => {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

export async function saveTokens(accessToken: string, refreshToken: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export async function getAccessToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return getItemAsync(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken() {
  if (Platform.OS === "web") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  if (Platform.OS === "web") {
    // Web Fallback
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}
