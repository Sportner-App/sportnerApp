import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { OrganizationImage } from "@/features/organizations/components/organization-image";

export function OrganizationPhotoPicker({
  uri,
  name,
  onPick,
  onRemove,
}: {
  uri?: string | null;
  name: string;
  onPick: () => void;
  /** Verilirse ve fotoğraf varsa "Fotoğrafı kaldır" bağlantısı çıkar. */
  onRemove?: () => void;
}) {
  const { t } = useTranslation("organizations");

  return (
    <View className="items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("photo.accessibility")}
        onPress={onPick}
        className="active:opacity-80"
      >
        <OrganizationImage
          uri={uri}
          name={name}
          size={96}
          radius={28}
          textClassName="text-heading-lg"
        />
        <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-background-secondary">
          <FontAwesome6
            name="camera"
            size={12}
            color={themeColors.brand.primary}
          />
        </View>
      </Pressable>
      <Pressable onPress={onPick} hitSlop={HIT_SLOP}>
        <Text className="font-body text-caption text-brand-primary">
          {uri ? t("photo.change") : t("photo.add")}
        </Text>
      </Pressable>
      {uri && onRemove ? (
        <Pressable onPress={onRemove} hitSlop={HIT_SLOP}>
          <Text className="font-body text-caption text-text-tertiary">
            {t("photo.remove")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
