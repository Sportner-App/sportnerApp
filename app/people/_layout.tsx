import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function PeopleLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
