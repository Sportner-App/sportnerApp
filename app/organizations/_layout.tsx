import { fullScreenBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function OrganizationsLayout() {
  return <Stack screenOptions={fullScreenBackStackOptions} />;
}
