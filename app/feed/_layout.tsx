import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function FeedLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
