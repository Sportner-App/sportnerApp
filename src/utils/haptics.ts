import * as Haptics from "expo-haptics";

export function lightImpact() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function successNotification() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function errorNotification() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}
