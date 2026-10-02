import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { themeColors } from "@/constants/theme";
import type { ButtonVariant, IconName } from "@/types/components";

import { AppText as Text } from "./app-text";
import { Button } from "./button";

type EmptyStateAction = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
};

type EmptyStateProps = {
  message: string;
  /** `card` (varsayılan) çerçeveli kart; `inline` liste içinde düz metin. */
  variant?: "card" | "inline";
  icon?: IconName;
  action?: EmptyStateAction;
  /**
   * `card`: ek sınıflar (ör. `mx-5`). `inline`: varsayılan `py-8` dikey
   * boşluğun yerine geçer.
   */
  className?: string;
};

/** Liste/ekran boşken gösterilen kart. */
export function EmptyState({
  message,
  variant = "card",
  icon,
  action,
  className,
}: EmptyStateProps) {
  if (variant === "inline") {
    return (
      <Text
        className={`${className ?? "py-8"} text-center font-body text-body-sm text-text-tertiary`}
      >
        {message}
      </Text>
    );
  }

  return (
    <View
      className={`items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12 ${className ?? ""}`}
    >
      {icon ? (
        <FontAwesome6 name={icon} size={22} color={themeColors.text.tertiary} />
      ) : null}
      <Text className="text-center font-body text-body-sm text-text-secondary">
        {message}
      </Text>
      {action ? (
        <Button
          label={action.label}
          variant={action.variant ?? "outline"}
          size="sm"
          onPress={action.onPress}
        />
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  icon?: IconName;
  className?: string;
};

/** Yükleme hatası kartı; "Tekrar dene" ile. */
export function ErrorState({
  message,
  onRetry,
  icon = "triangle-exclamation",
  className,
}: ErrorStateProps) {
  const { t } = useTranslation("common");
  return (
    <EmptyState
      message={message}
      icon={icon}
      className={className}
      action={{ label: t("retry"), onPress: onRetry }}
    />
  );
}
