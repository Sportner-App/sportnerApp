import { edgeBackStackOptions } from "@/constants/navigation";
import { Stack } from "expo-router";

export default function EventsLayout() {
  return (
    <Stack screenOptions={edgeBackStackOptions}>
      <Stack.Screen
        name="create"
        options={{ presentation: "modal", headerShown: false }}
      />
    </Stack>
  );
}
