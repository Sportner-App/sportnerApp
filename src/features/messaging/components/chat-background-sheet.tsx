import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { AppText as Text, BottomSheet } from "@/components";
import { themeColors } from "@/constants/theme";
import {
  ChatBackground,
  CHAT_BACKGROUND_IDS,
  type ChatBackgroundId,
} from "@/features/messaging/chat-backgrounds";

/**
 * Zemin seçimi sohbetin kendi içinden yapılıyor: ayarlara gömmek, kullanıcının
 * hangi sohbeti değiştirdiğini ayrıca seçtirmek demekti. Her seçenek küçük bir
 * önizleme olarak gösteriliyor — isimler tek başına neyin değişeceğini
 * anlatmıyor.
 */
export function ChatBackgroundSheet({
  visible,
  onClose,
  selected,
  onSelect,
  eventImageUrl,
}: {
  visible: boolean;
  onClose: () => void;
  selected: ChatBackgroundId;
  onSelect: (next: ChatBackgroundId) => void;
  /** Etkinlik sohbetinde kapak görseli ilk sırada bir seçenek olarak durur. */
  eventImageUrl?: string | null;
}) {
  const { t } = useTranslation("messaging");

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("background.title")}
      subtitle={t("background.subtitle")}
    >
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {CHAT_BACKGROUND_IDS.filter(
          (id) => id !== "etkinlik" || Boolean(eventImageUrl),
        ).map((id) => {
          const active = id === selected;

          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => {
                onSelect(id);
                onClose();
              }}
              className="w-[48%] gap-2 active:opacity-75"
            >
              <View
                className={`h-32 overflow-hidden rounded-2xl border ${
                  active ? "border-brand-primary" : "border-border-default"
                }`}
              >
                <ChatBackground variant={id} imageUrl={eventImageUrl} />
                {active ? (
                  <View className="absolute right-2 top-2">
                    <FontAwesome6
                      name="circle-check"
                      size={16}
                      color={themeColors.brand.primary}
                    />
                  </View>
                ) : null}
              </View>
              <Text
                className={`text-center font-body-bold text-caption ${
                  active ? "text-brand-primary" : "text-text-secondary"
                }`}
              >
                {t(`background.options.${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
