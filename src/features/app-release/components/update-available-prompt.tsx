import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import { AppState, Linking, Platform, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

// Barrel yerine dogrudan dosyalar: contexts -> components -> contexts cycle'i.
import { AppText as Text } from "@/components/app-text";
import { BottomSheet } from "@/components/bottom-sheet";
import { Button } from "@/components/button";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { getLatestIosRelease } from "@/features/app-release/services/app-release-service";
import { isVersionBelow } from "@/features/app-release/version";

type AvailableUpdate = { version: string; storeUrl: string };

/**
 * İsteğe bağlı "yeni sürüm var" hatırlatması. Otomatik güncellemeyi fark
 * etmeyen kullanıcılar eski sürümde kalıyor; bu onlara nazikçe haber verir.
 * Zorunlu eşik ayrı: bkz. UpdateRequiredGate.
 *
 * Güncel sürüm iTunes Lookup'tan okunur. Backend'in /api/app/release ucu
 * yalnızca alt sınırı biliyor, en son yayınlanan sürümü değil; Lookup ise
 * App Store yayına aldığı anda doğru cevabı veriyor, elle tutulacak bir
 * ayar yok. Play'in böyle herkese açık bir ucu olmadığından (ve in-app
 * update kütüphanesi kurulu olmadığından) Android'de şimdilik gösterilmez.
 *
 * "Daha sonra" o sürümü cihazda hatırlar; bir sonraki sürüm çıkana kadar
 * tekrar sorulmaz.
 */
export function UpdateAvailablePrompt({ children }: PropsWithChildren) {
  const { t } = useTranslation("common");
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);

  const check = useCallback(async () => {
    const current = Constants.expoConfig?.version;
    const bundleId = Constants.expoConfig?.ios?.bundleIdentifier;

    if (Platform.OS !== "ios" || !current || !bundleId) {
      return;
    }

    const latest = await getLatestIosRelease(bundleId);
    if (!latest || !isVersionBelow(current, latest.version)) {
      return;
    }

    const dismissed = await AsyncStorage.getItem(
      STORAGE_KEYS.dismissedUpdateVersion,
    );
    if (dismissed === latest.version) {
      return;
    }

    setUpdate(latest);
  }, []);

  useEffect(() => {
    // Çevrimdışıysa ya da Lookup cevap vermezse sessizce geçilir.
    void check().catch(() => undefined);

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void check().catch(() => undefined);
      }
    });

    return () => subscription.remove();
  }, [check]);

  const handleLater = () => {
    if (update) {
      void AsyncStorage.setItem(
        STORAGE_KEYS.dismissedUpdateVersion,
        update.version,
      ).catch(() => undefined);
    }
    setUpdate(null);
  };

  const handleUpdate = () => {
    if (update) {
      void Linking.openURL(update.storeUrl).catch(() => undefined);
    }
    // Mağazadan güncellemeden dönerse bir sonraki öne gelişte tekrar sorulur.
    setUpdate(null);
  };

  return (
    <>
      {children}

      <BottomSheet
        visible={update != null}
        onClose={handleLater}
        showCancel={false}
        title={t("updateAvailable.title")}
        subtitle={t("updateAvailable.description", {
          version: update?.version ?? "",
        })}
      >
        <View className="gap-3">
          <Button label={t("updateAvailable.action")} onPress={handleUpdate} />
          <Pressable onPress={handleLater} className="items-center py-1">
            <Text className="font-body text-caption text-text-secondary">
              {t("updateAvailable.later")}
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </>
  );
}
