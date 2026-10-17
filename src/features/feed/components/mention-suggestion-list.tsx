import { FlatList, Pressable, View } from "react-native";

import { AppText as Text } from "@/components/app-text";
import { Avatar } from "@/components/avatar";
import type { MentionCandidate } from "@/features/feed/hooks/use-mention-composer";

/**
 * Etiket önerileri. Giriş alanının üzerinde yüzen küçük bir kutu değil:
 * bulunduğu alanı doldurur ve yazarken ekranın içerik bölümünün yerini alır.
 *
 * Önceki yüzen kutu iki şeyi birden yanlış yapıyordu. Listeyi aşağı açtığında
 * ekranın dışına taşıp kırpılıyor, kullanıcı alttaki kişilere ne dokunabiliyor
 * ne de kaydırabiliyordu; "sığıyor mu" hesabı da klavye yüksekliğini bilmediği
 * için güvenilmezdi. Alanı doldurmak bu hesabı tümüyle ortadan kaldırıyor —
 * ne kadar yer varsa o kadar liste görünüyor, gerisi kaydırılıyor.
 *
 * Popüler uygulamaların yaptığı da bu: etiketlerken içerik alanı geçici olarak
 * kişi listesine dönüşüyor, giriş alanı yerinde kalıyor.
 */
export function MentionSuggestionList({
  suggestions,
  onSelect,
  emptyLabel,
}: {
  suggestions: MentionCandidate[];
  onSelect: (candidate: MentionCandidate) => void;
  emptyLabel: string;
}) {
  if (suggestions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6 py-8">
        <Text className="text-center font-body text-body-sm text-text-tertiary">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={suggestions}
      keyExtractor={(candidate) => candidate.userId}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      contentContainerClassName="py-1"
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onSelect(item)}
          className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-70"
        >
          <Avatar uri={item.profileImageUrl} name={item.firstName} size={34} />
          <View className="flex-1">
            <Text className="font-body-bold text-body-sm text-text-primary">
              @{item.username}
            </Text>
            {item.firstName ? (
              <Text className="font-body text-caption text-text-tertiary">
                {item.firstName}
              </Text>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}
