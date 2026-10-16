import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Switch, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  AppText as Text,
  ErrorState,
  ScreenHeader,
  ScreenLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { useToast } from "@/contexts/toast-provider";
import {
  ALL_GROUPED_TYPES,
  NOTIFICATION_GROUPS,
  type NotificationGroup,
} from "@/features/notifications/settings-groups";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "@/features/notifications/services/notifications-service";

/** Türe göre push durumu. */
type PushByType = Record<number, boolean>;

export function NotificationSettingsScreen() {
  const { t } = useTranslation("notifications");
  const { showToast } = useToast();

  const [pushByType, setPushByType] = useState<PushByType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    void getNotificationSettings()
      .then((settings) => {
        const next: PushByType = {};
        // Sunucu satırı olmayan türler için varsayılan açık: yayıncı da satır
        // yokken tür varsayılanına düşüyor ve o da push açık.
        for (const type of ALL_GROUPED_TYPES) {
          next[type] = true;
        }
        for (const setting of settings) {
          next[setting.notificationType] = setting.pushEnabled;
        }
        setPushByType(next);
      })
      .catch(() => setError(t("settings.loadFailed")));
  }, [t]);

  useEffect(load, [load]);

  const groupState = useMemo(() => {
    if (!pushByType) return null;

    return NOTIFICATION_GROUPS.reduce<Record<string, boolean>>((acc, group) => {
      // Grup, türlerinden herhangi biri açıkken açık sayılır. Kapatmak hepsini
      // kapatır, açmak hepsini açar — kısmi durum kullanıcıya gösterilmiyor,
      // çünkü onu düzeltmesinin bir yolu yok.
      acc[group.key] = group.types.some((type) => pushByType[type]);
      return acc;
    }, {});
  }, [pushByType]);

  const toggleGroup = async (group: NotificationGroup, enabled: boolean) => {
    if (!pushByType || savingGroup) return;

    const previous = pushByType;
    const optimistic = { ...pushByType };
    for (const type of group.types) {
      optimistic[type] = enabled;
    }

    setPushByType(optimistic);
    setSavingGroup(group.key);

    try {
      await updateNotificationSettings(
        group.types.map((type) => ({
          notificationType: type,
          inAppEnabled: true,
          pushEnabled: enabled,
          emailEnabled: false,
        })),
      );
    } catch {
      setPushByType(previous);
      showToast({ title: t("settings.saveFailed"), type: "error" });
    } finally {
      setSavingGroup(null);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title={t("settings.title")} showBack />}
      contentClassName="gap-5 px-6 pt-3"
    >
      {error ? (
        <ErrorState
          icon="triangle-exclamation"
          message={error}
          onRetry={load}
        />
      ) : !pushByType || !groupState ? (
        <ScreenLoader />
      ) : (
        <>
          <View className="gap-2">
            <Text className="font-display text-heading-lg text-text-primary">
              {t("settings.heading")}
            </Text>
            <Text className="font-body text-body-sm leading-5 text-text-tertiary">
              {t("settings.subtitle")}
            </Text>
          </View>

          <View className="gap-3">
            {NOTIFICATION_GROUPS.map((group) => {
              const enabled = groupState[group.key];

              return (
                <View
                  key={group.key}
                  className="flex-row items-center gap-4 rounded-3xl border border-border-default bg-surface-primary px-4 py-4"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      enabled ? "bg-brand-primary/10" : "bg-background-secondary"
                    }`}
                  >
                    <FontAwesome6
                      name={group.icon}
                      size={14}
                      color={
                        enabled
                          ? themeColors.brand.primary
                          : themeColors.text.tertiary
                      }
                    />
                  </View>

                  <View className="flex-1 gap-1">
                    <Text className="font-body-bold text-body text-text-primary">
                      {t(`settings.groups.${group.key}.title`)}
                    </Text>
                    <Text className="font-body text-caption leading-4 text-text-tertiary">
                      {t(`settings.groups.${group.key}.description`)}
                    </Text>
                  </View>

                  <Switch
                    value={enabled}
                    disabled={savingGroup !== null}
                    onValueChange={(next) => void toggleGroup(group, next)}
                    trackColor={{
                      false: themeColors.surface.secondary,
                      true: themeColors.brand.primary,
                    }}
                    thumbColor={themeColors.background.primary}
                  />
                </View>
              );
            })}
          </View>

          <Text className="font-body text-caption leading-4 text-text-tertiary">
            {t("settings.footnote")}
          </Text>
        </>
      )}
    </AppScreen>
  );
}
