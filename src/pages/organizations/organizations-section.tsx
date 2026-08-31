import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { PROFILE_COPY } from "@/constants/profile";
import { useMyOrganizations } from "@/hooks/use-organizations";
import { ORGANIZATION_STATUS } from "@/types/organizations";

type OrganizationsSectionProps = {
  onPressList?: () => void;
  onPressItem?: (organizationId: string) => void;
};

export function OrganizationsSection({
  onPressList,
  onPressItem,
}: OrganizationsSectionProps) {
  const { items } = useMyOrganizations();
  const visible = items.slice(0, 4);
  const remaining = items.length - visible.length;

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(70)}
      className="gap-3"
    >
      <View className="flex-row items-center justify-between">
        <Text className="font-display text-lg text-text-primary">
          {PROFILE_COPY.organizationsTitle}
        </Text>
        {onPressList ? (
          <Pressable onPress={onPressList} hitSlop={8}>
            <Text className="font-body text-[11px] font-semibold text-brand-primary">
              {items.length === 0 ? "Ekle" : "Tümü"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <Pressable
          disabled={!onPressList}
          onPress={onPressList}
          className="rounded-[20px] border border-dashed border-border-strong bg-surface-primary/50 px-4 py-5"
        >
          <Text className="text-center font-body text-sm text-text-secondary">
            {PROFILE_COPY.emptyOrganizations}
          </Text>
        </Pressable>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {visible.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onPressItem?.(item.id)}
              className={`flex-row items-center gap-2 rounded-full border px-3 py-2.5 ${
                item.status === ORGANIZATION_STATUS.pending
                  ? "border-amber-300/30 bg-amber-400/10"
                  : "border-brand-primary/30 bg-brand-primary/10"
              }`}
            >
              <FontAwesome6 name="users" size={11} color="#ccff00" />
              <Text className="font-body text-xs font-semibold text-text-primary">
                {item.name}
              </Text>
              {item.status === ORGANIZATION_STATUS.pending ? (
                <Text className="font-body text-[9px] text-amber-300">
                  Bekliyor
                </Text>
              ) : null}
            </Pressable>
          ))}
          {remaining > 0 ? (
            <Pressable
              onPress={onPressList}
              className="rounded-full border border-border-default bg-surface-primary px-3 py-2.5"
            >
              <Text className="font-mono text-xs text-text-secondary">
                +{remaining}
              </Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
}
