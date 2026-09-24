import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function NotificationsLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
