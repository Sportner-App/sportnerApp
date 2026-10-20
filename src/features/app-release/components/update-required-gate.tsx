import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Linking, Platform, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { AppText as Text, Button } from "@/components";
import { themeColors } from "@/constants/theme";
import { getAppRelease } from "@/features/app-release/services/app-release-service";
import { isVersionBelow } from "@/features/app-release/version";

/**
 * Sürüm alt sınırı.
 *
 * Günlük düzeltmeler OTA ile sessizce iniyor, kullanıcıya hiçbir şey
 * sormuyoruz. Bu kapı yalnızca OTA'nın yetmediği durum için: native bir
 * değişiklik ya da eski istemcinin artık konuşamadığı bir API değişikliği
 * olduğunda. Eşik sunucuda boş tutulduğu sürece hiç görünmez.
 *
 * Kasıtlı olarak kapatılamaz: "sonra" diyebilen bir uyarı, zaten çalışmayan
 * bir uygulamayı kullanmaya devam ettirmekten başka işe yaramaz. Nazik
 * hatırlatma istiyorsak onun yeri burası değil.
 */
export function UpdateRequiredGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation("common");
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getAppRelease(Platform.OS)
      .then((release) => {
        const current = Constants.expoConfig?.version;

        if (
          cancelled ||
          !current ||
          !release.minimumVersion ||
          !isVersionBelow(current, release.minimumVersion)
        ) {
          return;
        }

        setStoreUrl(release.storeUrl);
        setBlocked(true);
      })
      // Sunucuya ulaşılamıyorsa uygulama açılmaya devam eder: çevrimdışı bir
      // kullanıcıyı güncelleme ekranında kilitlemek en kötü sonuç olurdu.
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!blocked) {
    return <>{children}</>;
  }

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background-primary px-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-primary/15">
        <FontAwesome6
          name="arrow-up"
          size={24}
          color={themeColors.brand.primary}
        />
      </View>

      <View className="gap-2">
        <Text className="text-center font-display text-heading-md text-text-primary">
          {t("updateRequired.title")}
        </Text>
        <Text className="text-center font-body text-body-sm leading-5 text-text-secondary">
          {t("updateRequired.description")}
        </Text>
      </View>

      {storeUrl ? (
        <Button
          label={t("updateRequired.action")}
          onPress={() => void Linking.openURL(storeUrl)}
        />
      ) : null}
    </View>
  );
}
