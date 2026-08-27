import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components";
import { CREATE_EVENT_COPY } from "@/constants/events";
import { shadows } from "@/constants/theme";

type SubmitBarProps = {
  disabled: boolean;
  isLoading: boolean;
  onSubmit: () => void;
  label?: string;
  onBack?: () => void;
  backLabel?: string;
  showIcon?: boolean;
  pressScale?: number;
  haptic?: "light";
  loadingLabel?: string;
};

export function SubmitBar({
  disabled,
  isLoading,
  onSubmit,
  label = CREATE_EVENT_COPY.submit,
  onBack,
  backLabel = CREATE_EVENT_COPY.back,
  showIcon = true,
  pressScale,
  haptic,
  loadingLabel,
}: SubmitBarProps) {
  const insets = useSafeAreaInsets();

  const primary = (
    <Button
      label={label}
      size="lg"
      icon={showIcon ? "paper-plane" : undefined}
      disabled={disabled}
      isLoading={isLoading}
      loadingLabel={loadingLabel}
      pressScale={pressScale}
      haptic={haptic}
      onPress={onSubmit}
    />
  );

  return (
    <View
      className="border-t border-border-default bg-background-primary/95 px-5 pt-3"
      style={[shadows.lg, { paddingBottom: insets.bottom + 10 }]}
    >
      {onBack ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label={backLabel}
              size="lg"
              variant="outline"
              icon="arrow-left"
              disabled={isLoading}
              pressScale={pressScale}
              haptic={haptic}
              onPress={onBack}
            />
          </View>
          <View className="flex-1">{primary}</View>
        </View>
      ) : (
        primary
      )}
    </View>
  );
}
