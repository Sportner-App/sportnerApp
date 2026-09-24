import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function FriendsLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
