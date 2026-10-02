import { Alert } from "react-native";

import i18n from "@/i18n";

type ConfirmDestructiveOptions = {
  title: string;
  message: string;
  confirmLabel: string;
  /** Verilmezse genel "Vazgeç". */
  cancelLabel?: string;
  onConfirm: () => void;
};

/** Silme/çıkarma gibi geri alınamaz işlemler için yerel onay diyaloğu. */
export function confirmDestructive({
  title,
  message,
  confirmLabel,
  cancelLabel = i18n.t("common:cancel"),
  onConfirm,
}: ConfirmDestructiveOptions) {
  Alert.alert(title, message, [
    { text: cancelLabel, style: "cancel" },
    { text: confirmLabel, style: "destructive", onPress: onConfirm },
  ]);
}
