import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import { CREATE_EVENT_COPY } from "@/constants/events";

type SubmitBarProps = {
  disabled: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  label?: string;
};

export function SubmitBar({
  disabled,
  isLoading,
  onSubmit,
  label = CREATE_EVENT_COPY.submit,
}: SubmitBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-white/10 bg-brand-secondary px-6 pt-4"
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      <Button
        label={label}
        size="lg"
        icon="paper-plane"
        disabled={disabled}
        isLoading={isLoading}
        onPress={onSubmit}
      />
    </View>
  );
}
