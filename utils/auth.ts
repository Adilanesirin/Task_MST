// utils/auth.ts
import * as SecureStore from "expo-secure-store";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync("token", token);
}

export async function getToken() {
  return await SecureStore.getItemAsync("token");
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
}

// 🎯 FIXED: Changed setItem to setItemAsync
export async function saveUserid(user_id: string) {
  await SecureStore.setItemAsync("user_id", user_id);
  console.log("✅ Saved user_id to SecureStore:", user_id);
}

export async function getUserid() {
  return await SecureStore.getItemAsync("user_id");
}

export async function deleteUserid() {
  await SecureStore.deleteItemAsync("user_id");
}