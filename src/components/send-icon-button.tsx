import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ActivityIndicator, Pressable } from "react-native";

import { HIT_SLOP, themeColors } from "@/constants/theme";

/** Yazma alanlarının gönder ikonu; etiket erişilebilirlik adında kalır. */
export function SendIconButton({
  label,
  disabled,
  loading = false,
  onPress,
}: {
  label: string;
  disabled: boolean;
  loading?: boolean;
  onPress: () => void;
}) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      className={`h-10 w-10 shrink-0 items-center justify-center rounded-full active:opacity-75 ${
        disabled ? "bg-surface-secondary" : "bg-brand-primary"
      }`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={themeColors.background.primary} />
      ) : (
        <FontAwesome6
          name="paper-plane"
          size={15}
          color={
            disabled ? themeColors.text.tertiary : themeColors.background.primary
          }
        />
      )}
    </Pressable>
  );
}
