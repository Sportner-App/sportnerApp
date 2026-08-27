import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";

/** Marka renkleriyle custom harita pin'i */
export function MapPin() {
  return (
    <View className="items-center">
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-brand-primary bg-background-primary shadow-lg shadow-brand-primary">
        <FontAwesome6 name="location-dot" size={18} color="#ccff00" />
      </View>
      <View className="-mt-1 h-2 w-2 rotate-45 bg-brand-primary" />
    </View>
  );
}
