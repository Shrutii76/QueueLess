import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "queueless_access_token";

let accessToken: string | null = null;

export const tokenManager = {
  async save(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    accessToken = token;
  },

  async get(): Promise<string | null> {
    if (accessToken) return accessToken;

    accessToken = await SecureStore.getItemAsync(TOKEN_KEY);
    return accessToken;
  },

  getMemoryToken(): string | null {
    return accessToken;
  },

  async clear(): Promise<void> {
    accessToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
