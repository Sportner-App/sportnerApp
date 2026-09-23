import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";

import { themeColors } from "@/constants/theme";
import { AppText as Text } from "@/components/app-text";

type MapUnavailableProps = {
  message: string;
};

/** Harita sağlayıcısı kullanılamadığında MapView yerine geçen bilgi kutusu. */
export function MapUnavailable({ message }: MapUnavailableProps) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-surface-primary px-6">
      <FontAwesome6
        name="map-location-dot"
        size={20}
        color={themeColors.text.tertiary}
      />
      <Text className="text-center font-body text-caption text-text-secondary">
        {message}
      </Text>
    </View>
  );
}
