import { Stack, useRouter } from "expo-router";
import { Text, View } from "react-native";

import { AppScreen, Button } from "@/components";

export function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AppScreen
        scroll={false}
        contentClassName="items-center justify-center gap-4 px-6"
      >
        <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
        <Text className="font-mono text-xs tracking-[4px] text-brand-neutral">
          404
        </Text>
        <Text className="text-center font-display text-3xl text-text-primary">
          Sayfa bulunamadı
        </Text>
        <Text className="max-w-[280px] text-center font-body text-sm leading-5 text-brand-neutral">
          Aradığın ekran taşınmış veya hiç var olmamış olabilir.
        </Text>
        <Button
          label="Etkinlikler Sayfasına Dön"
          size="md"
          onPress={() => router.replace("/(tabs)")}
        />
      </AppScreen>
    </>
  );
}
