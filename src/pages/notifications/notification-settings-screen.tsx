import { useEffect, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";

import { AppScreen, ScreenHeader, SportLoader } from "@/components";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  getNotificationSettings,
  updateNotificationSetting,
} from "@/services/notifications-service";
import type { ApiNotificationSetting } from "@/types/notifications";
import { NOTIFICATION_SETTING_LABELS } from "@/types/notifications";

export function NotificationSettingsScreen() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<ApiNotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getNotificationSettings()
      .then(setSettings)
      .catch((error) =>
        showToast({
          type: "error",
          title: "Yüklenemedi",
          description: getApiErrorMessage(error),
        }),
      )
      .finally(() => setIsLoading(false));
  }, [showToast]);

  const toggle = async (
    item: ApiNotificationSetting,
    key: "inAppEnabled" | "pushEnabled",
    value: boolean,
  ) => {
    const next = { ...item, [key]: value };
    setSettings((prev) =>
      prev.map((row) =>
        row.notificationType === item.notificationType ? next : row,
      ),
    );
    try {
      await updateNotificationSetting(item.notificationType, {
        inAppEnabled: next.inAppEnabled,
        pushEnabled: next.pushEnabled,
        emailEnabled: next.emailEnabled,
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Kaydedilemedi",
        description: getApiErrorMessage(error),
      });
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="BİLDİRİM AYARLARI" showBack />}
      contentClassName="gap-3 px-6 pt-3"
    >
      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : (
        settings.map((item) => (
          <View
            key={item.notificationType}
            className="gap-3 rounded-3xl border border-border-default bg-surface-primary p-4"
          >
            <Text className="font-body text-sm font-semibold text-text-primary">
              {NOTIFICATION_SETTING_LABELS[item.notificationType] ??
                `Tür ${item.notificationType}`}
            </Text>
            <Row
              label="Uygulama içi"
              value={item.inAppEnabled}
              onChange={(value) => toggle(item, "inAppEnabled", value)}
            />
            <Row
              label="Cihaz bildirimi"
              value={item.pushEnabled}
              onChange={(value) => toggle(item, "pushEnabled", value)}
            />
          </View>
        ))
      )}
    </AppScreen>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      className="flex-row items-center justify-between"
    >
      <Text className="font-body text-xs text-brand-neutral">{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: "#ccff00", false: "#334155" }}
        thumbColor="#06111a"
      />
    </Pressable>
  );
}
