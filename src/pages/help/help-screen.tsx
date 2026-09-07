import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppScreen, Button, ScreenHeader } from "@/components";

export function HelpScreen() {
  const router = useRouter();
  const { t } = useTranslation("help");
  const faq = t("faq", { returnObjects: true }) as Array<{ q: string; a: string }>;

  return (
    <AppScreen
      header={<ScreenHeader title={t("title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      <Text className="font-display text-3xl text-text-primary">
        {t("heading")}
      </Text>
      {faq.map((item) => (
        <View
          key={item.q}
          className="rounded-3xl border border-border-default bg-surface-primary p-4"
        >
          <Text className="font-body text-sm font-semibold text-text-primary">
            {item.q}
          </Text>
          <Text className="mt-2 font-body text-sm text-brand-neutral">
            {item.a}
          </Text>
        </View>
      ))}

      <View className="gap-3 rounded-3xl border border-white/10 bg-brand-surface/90 p-4">
        <Text className="font-body text-sm font-semibold text-white">
          {t("feedback.title")}
        </Text>
        <Text className="font-body text-sm text-brand-neutral">
          {t("feedback.description")}
        </Text>
        <Button
          label={t("feedback.cta")}
          variant="outline"
          size="sm"
          onPress={() => router.push("/feedback")}
        />
      </View>
    </AppScreen>
  );
}
