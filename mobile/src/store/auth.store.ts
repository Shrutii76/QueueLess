import { create } from "zustand";

import { authService } from "../services/auth.service";
import { tokenManager } from "../api/token-manager";
import { setUnauthorizedHandler } from "../api/axios";

import type { User, LoginPayload, RegisterPayload } from "../types/auth.types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  clearSession: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  register: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await authService.register(payload);

      await tokenManager.save(result.token);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (payload) => {
    set({ isLoading: true });

    try {
      const result = await authService.login(payload);

      await tokenManager.save(result.token);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Server logout failed; clearing local session.");
    } finally {
      await tokenManager.clear();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const savedToken = await tokenManager.get();

      if (!savedToken) {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        return;
      }

      // Ask the backend to validate the saved token.
      const user = await authService.me();

      set({
        user,
        token: savedToken,
        isAuthenticated: true,
      });
    } catch (error) {
      await tokenManager.clear();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        isLoading: false,
        isInitialized: true,
      });
    }
  },
}));

// Automatically clear Zustand state when Axios receives HTTP 401.
setUnauthorizedHandler(() => {
  useAuthStore.getState().clearSession();
});
