import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { View } from "react-native";

import { BodyText, SectionTitle } from "@/shared/ui/typography";

export function EmptyState() {
  return (
    <View className="items-center justify-center rounded-2xl border border-brand-tertiary bg-brand-surface px-6 py-10">
      <FontAwesome6 name="calendar-xmark" size={40} color="#ccff00" />
      <SectionTitle className="mt-4 text-center text-white">
        Yakında henüz etkinlik yok
      </SectionTitle>
      <BodyText className="mt-2 text-center">
        Yeni bir etkinlik oluşturulduğunda burada listelenecek.
      </BodyText>
    </View>
  );
}
