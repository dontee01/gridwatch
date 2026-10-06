import React, { createContext, useContext, useEffect, useState } from "react";

import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from "../api/auth.api";

import {
  clearTokens,
  getAccessToken,
  saveTokens,
} from "../storage/auth.storage";

import { LoginDto, RegisterDto, User } from "../types/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  authenticated: boolean;

  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const authenticated = !!user;

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const token = await getAccessToken();

      if (!token) {
        return;
      }

      const currentUser = await getMe();

      setUser(currentUser);
    } catch {
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(data: LoginDto) {
    const response = await loginApi(data);

    await saveTokens(response.accessToken, response.refreshToken);

    const currentUser = response.user ?? (await getMe());

    setUser(currentUser);
  }

  async function register(data: RegisterDto) {
    const response = await registerApi(data);

    await saveTokens(response.accessToken, response.refreshToken);

    const currentUser = response.user ?? (await getMe());

    setUser(currentUser);
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      await clearTokens();
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
