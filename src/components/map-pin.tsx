import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";
import { themeColors } from "@/constants/theme";

/** Marka renkleriyle custom harita pin'i */
export function MapPin() {
  return (
    <View className="items-center">
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-brand-primary bg-background-primary shadow-lg shadow-brand-primary">
        <FontAwesome6
          name="location-dot"
          size={18}
          color={themeColors.brand.primary}
        />
      </View>
      <View className="-mt-1 h-2 w-2 rotate-45 bg-brand-primary" />
    </View>
  );
}

/**
 * "Buradasın" noktası. Seçim iğnesiyle karışmasın diye farklı bir biçim:
 * iğne değil, halkalı bir nokta — haritalarda alışılmış gösterim bu.
 */
export function UserDot() {
  return (
    <View className="h-6 w-6 items-center justify-center rounded-full bg-sport-running/25">
      <View className="h-3.5 w-3.5 rounded-full border-2 border-white bg-sport-running" />
    </View>
  );
}
