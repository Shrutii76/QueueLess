import { api } from "../api/axios";
import {
  AuthResponse,
  MeResponse,
  RegisterPayload,
  LoginPayload,
} from "../types/auth.types";

export const authService = {
  async register(payload: RegisterPayload) {
    const response = await api.post<AuthResponse>("/auth/register", payload);

    return response.data.data;
  },

  async login(payload: LoginPayload) {
    const response = await api.post<AuthResponse>("/auth/login", payload);

    return response.data.data;
  },

  async me() {
    const response = await api.get<MeResponse>("/auth/me");

    return response.data.data.user;
  },

  async logout() {
    const response = await api.post("/auth/logout");

    return response.data;
  },
};
