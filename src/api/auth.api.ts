import { api } from "./client";

import {
  AuthResponse,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  User,
} from "../types/auth";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function login(payload: LoginDto): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/login",
    payload,
  );

  return response.data.data;
}

export async function register(payload: RegisterDto): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/register",
    payload,
  );

  return response.data.data;
}

export async function refreshToken(
  payload: RefreshTokenDto,
): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>(
    "/auth/refresh",
    payload,
  );

  return response.data.data;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function getMe(): Promise<User> {
  const response = await api.get<ApiResponse<User>>("/users/me");

  return response.data.data;
}
