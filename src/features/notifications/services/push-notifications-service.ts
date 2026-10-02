import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import i18n from "@/i18n";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { apiClient } from "@/lib/api/client";

type DeviceResponse = {
  id: string;
};

function createDeviceIdentifier() {
  return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function getDeviceIdentifier() {
  const existing = await AsyncStorage.getItem(
    STORAGE_KEYS.pushDeviceIdentifier,
  );
  if (existing) return existing;

  const identifier = createDeviceIdentifier();
  await AsyncStorage.setItem(STORAGE_KEYS.pushDeviceIdentifier, identifier);
  return identifier;
}

export function configureForegroundNotifications() {
  // The OS banner is suppressed in favor of the app's own top-down in-app banner
  // (InAppNotificationBanner) so a foreground notification isn't shown twice.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: false,
      shouldShowList: true,
    }),
  });
}

export async function registerCurrentDeviceForPush() {
  if (!Device.isDevice) {
    console.info("");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: i18n.t("notifications:push.channelName"),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      lightColor: "#CCFF00",
      sound: "default",
    });
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  const permissions =
    currentPermissions.status === Notifications.PermissionStatus.GRANTED
      ? currentPermissions
      : await Notifications.requestPermissionsAsync();

  if (permissions.status !== Notifications.PermissionStatus.GRANTED)
    return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    throw new Error(i18n.t("notifications:push.projectIdMissing"));
  }

  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId }))
    .data;
  const deviceIdentifier = await getDeviceIdentifier();

  const response = await apiClient.post<DeviceResponse>("/api/me/devices", {
    platform: Platform.OS === "ios" ? 0 : 1,
    deviceIdentifier,
    deviceName: Device.deviceName ?? Device.modelName ?? null,
    appVersion: Constants.expoConfig?.version ?? null,
    osVersion: Device.osVersion ?? String(Platform.Version),
    pushToken,
  });

  await AsyncStorage.setItem(STORAGE_KEYS.pushDeviceId, response.data.id);
  return pushToken;
}

export async function clearCurrentDevicePushToken() {
  const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.pushDeviceId);
  if (!deviceId) return;

  await apiClient.put(`/api/me/devices/${deviceId}/push-token`, {
    pushToken: null,
  });
}
