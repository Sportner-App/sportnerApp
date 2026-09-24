import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function ProfileStackLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
