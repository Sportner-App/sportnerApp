import {
  edgeBackStackOptions,
  fullScreenBackStackOptions,
} from "@/constants/navigation";
import { Stack } from "expo-router";

export default function EventDetailLayout() {
  return (
    <Stack screenOptions={fullScreenBackStackOptions}>
      <Stack.Screen name="index" options={edgeBackStackOptions} />
      <Stack.Screen name="edit" options={edgeBackStackOptions} />
    </Stack>
  );
}
