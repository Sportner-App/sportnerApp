import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import { AppScreen, Button } from "@/components";

export function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation("common");

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
          {t("notFound.title")}
        </Text>
        <Text className="max-w-[280px] text-center font-body text-sm leading-5 text-brand-neutral">
          {t("notFound.description")}
        </Text>
        <Button
          label={t("notFound.cta")}
          size="md"
          onPress={() => router.replace("/(tabs)")}
        />
      </AppScreen>
    </>
  );
}
