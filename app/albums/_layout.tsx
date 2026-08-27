import { FEATURE_FLAGS } from "@/constants/feature-flags";
import { Redirect, Stack } from "expo-router";

export default function AlbumsLayout() {
  if (!FEATURE_FLAGS.albums) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
