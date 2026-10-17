import { useCallback, useRef, useState, type PropsWithChildren } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";

import { AppText as Text } from "@/components/app-text";
import { Avatar } from "@/components/avatar";
import type { MentionCandidate } from "@/features/feed/hooks/use-mention-composer";

const ROW_HEIGHT = 48;
const MAX_VISIBLE_ROWS = 4;
const GAP = 6;

/**
 * Etiket önerilerini giriş alanının üstüne bindirir.
 *
 * Liste normal akışta dururken altındaki her şeyi aşağı itiyordu: soru-cevapta
 * gönder düğmesi, akışta sonraki gönderi kayıyordu. Mutlak konumlandırma bunu
 * kaldırıyor — giriş alanı yerinde kalıyor, liste üzerine açılıyor.
 *
 * Yön ekrana göre seçiliyor: alanın altında yetecek yer yoksa liste yukarı
 * açılıyor. Klavye açıkken giriş alanı ekranın altına yakın olduğu için bu
 * istisna değil, olağan durum.
 */
export function MentionField({
  children,
  suggestions,
  visible,
  onSelect,
}: PropsWithChildren<{
  suggestions: MentionCandidate[];
  visible: boolean;
  onSelect: (candidate: MentionCandidate) => void;
}>) {
  const anchorRef = useRef<View>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [anchorHeight, setAnchorHeight] = useState(0);
  const [placeAbove, setPlaceAbove] = useState(false);

  const listHeight =
    Math.min(suggestions.length, MAX_VISIBLE_ROWS) * ROW_HEIGHT + 16;

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((_x, y, _width, height) => {
      // Klavye yüksekliği burada bilinmiyor; ekranın alt üçte birine denk
      // gelen bir alanın altında liste açmak pratikte çalışmıyor.
      const spaceBelow = windowHeight - (y + height);
      setPlaceAbove(spaceBelow < listHeight + GAP * 4);
    });
  }, [listHeight, windowHeight]);

  return (
    <View
      ref={anchorRef}
      onLayout={(event) => {
        setAnchorHeight(event.nativeEvent.layout.height);
        measure();
      }}
      style={{ position: "relative", zIndex: visible ? 20 : 0 }}
    >
      {children}

      {visible && suggestions.length > 0 ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            maxHeight: listHeight,
            ...(placeAbove
              ? { bottom: anchorHeight + GAP }
              : { top: anchorHeight + GAP }),
            // Android'de zIndex tek başına yetmiyor.
            elevation: 8,
            zIndex: 20,
          }}
          className="overflow-hidden rounded-2xl border border-border-default bg-surface-primary"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            {suggestions.map((candidate) => (
              <Pressable
                key={candidate.userId}
                onPress={() => onSelect(candidate)}
                className="flex-row items-center gap-3 px-3 py-2 active:opacity-70"
                style={{ height: ROW_HEIGHT }}
              >
                <Avatar
                  uri={candidate.profileImageUrl}
                  name={candidate.firstName}
                  size={28}
                />
                <Text className="flex-1 font-body-bold text-body-sm text-text-primary">
                  @{candidate.username}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
