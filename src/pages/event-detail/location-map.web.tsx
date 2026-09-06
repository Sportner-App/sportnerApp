import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { themeColors, typeStyles } from "@/constants/theme";
import type { EventDetail } from "@/types/events";
import { noLocationLabel } from "@/utils/events";

type LocationMapProps = {
  event: EventDetail;
};

export function LocationMap({ event }: LocationMapProps) {
  const { t } = useTranslation("eventDetail");

  return (
    <View className="gap-3">
      <Text style={[typeStyles.label, { color: themeColors.text.secondary }]}>
        {t("location.heading")}
      </Text>
      <View className="rounded-xlarge border border-border-default bg-surface-primary px-4 py-3.5">
        <Text
          className="font-body text-sm"
          style={{ color: themeColors.text.primary }}
        >
          {event.address || noLocationLabel()}
        </Text>
      </View>
    </View>
  );
}
