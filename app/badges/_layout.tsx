import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function BadgesLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
