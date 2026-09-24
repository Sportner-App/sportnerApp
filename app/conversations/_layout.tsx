import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function ConversationsLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
