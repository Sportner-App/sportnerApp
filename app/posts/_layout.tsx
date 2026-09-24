import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function PostsLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
