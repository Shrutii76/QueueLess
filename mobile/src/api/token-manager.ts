import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const TOKEN_KEY = "queueless_access_token";

let accessToken: string | null = null;

export const tokenManager = {
  async save(token: string): Promise<void> {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }

    accessToken = token;
  },

  async get(): Promise<string | null> {
    if (accessToken) return accessToken;

    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        accessToken = localStorage.getItem(TOKEN_KEY);
      }
    } else {
      accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    }

    return accessToken;
  },

  getMemoryToken(): string | null {
    return accessToken;
  },

  async clear(): Promise<void> {
    accessToken = null;

    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  },
};
