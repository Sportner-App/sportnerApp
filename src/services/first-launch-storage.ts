import AsyncStorage from "@react-native-async-storage/async-storage";

import { HAS_SEEN_ONBOARDING_KEY } from "@/constants/first-launch";

export async function getHasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY);
  return value === "true";
}

export async function setHasSeenOnboarding(): Promise<void> {
  await AsyncStorage.setItem(HAS_SEEN_ONBOARDING_KEY, "true");
}
