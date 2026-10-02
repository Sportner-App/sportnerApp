import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_KEYS } from "@/constants/storage-keys";

export async function getHasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.hasSeenOnboarding);
  return value === "true";
}

export async function setHasSeenOnboarding(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.hasSeenOnboarding, "true");
}
