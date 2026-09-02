import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { apiClient } from "@/lib/api/client";

const DEVICE_IDENTIFIER_KEY = "push_device_identifier";
const DEVICE_ID_KEY = "push_device_id";

type DeviceResponse = {
  id: string;
};

function createDeviceIdentifier() {
  return `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

async function getDeviceIdentifier() {
  const existing = await AsyncStorage.getItem(DEVICE_IDENTIFIER_KEY);
  if (existing) return existing;

  const identifier = createDeviceIdentifier();
  await AsyncStorage.setItem(DEVICE_IDENTIFIER_KEY, identifier);
  return identifier;
}

export function configureForegroundNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerCurrentDeviceForPush() {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) {
    console.info("");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Sportner Bildirimleri",
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
    throw new Error("EAS projectId bulunamadı; push token alınamadı.");
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

  await AsyncStorage.setItem(DEVICE_ID_KEY, response.data.id);
  return pushToken;
}

export async function clearCurrentDevicePushToken() {
  if (Platform.OS === "web") return;

  const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) return;

  await apiClient.put(`/api/me/devices/${deviceId}/push-token`, {
    pushToken: null,
  });
}
