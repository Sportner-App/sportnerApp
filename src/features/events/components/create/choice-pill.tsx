import { Pressable } from "react-native";

import { AppText as Text } from "@/components";

type ChoicePillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

/** Etkinlik formunda tek seçimli yuvarlak seçenek (ücret, seviye). */
export function ChoicePill({ label, active, onPress }: ChoicePillProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
        active
          ? "border-brand-primary bg-brand-primary"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text
        className={`font-body-bold text-body-sm ${
          active ? "text-background-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
