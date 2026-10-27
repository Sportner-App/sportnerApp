import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { AppText as Text, Avatar } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import { sendFriendRequest } from "@/features/social/services/social-service";
import type { ExplorePerson } from "@/features/social/types";
import { getApiErrorMessage, isApiError } from "@/lib/api/errors";
import { displayHandle } from "@/utils/person";

/**
 * Önerilen sporcular.
 *
 * Önceden yalnızca çıplak avatar halkaları vardı: kimin kim olduğu
 * anlaşılmıyor, neden önerildiği hiç belli olmuyor ve tek yapılabilen şey
 * profile gitmekti. Oysa sunucu zaten ortak arkadaş, ortak spor ve şehir
 * bilgisini gönderiyor — kartlar artık bunu gösteriyor ve arkadaş eklemeyi
 * listeden çıkmadan yaptırıyor.
 */
export function PeopleRail({
  people,
  onOpenProfile,
  onSeeAll,
}: {
  people: ExplorePerson[];
  onOpenProfile: (userId: string) => void;
  onSeeAll: () => void;
}) {
  const { t } = useTranslation(["discover", "social"]);
  const { showToast } = useToast();
  const [gonderilen, setGonderilen] = useState<string[]>([]);
  const [islemdeki, setIslemdeki] = useState<string | null>(null);

  /** Önerinin sebebi: en güçlü bağdan en zayıfına. */
  const sebep = (kisi: ExplorePerson) => {
    if (kisi.mutualFriendsCount > 0) {
      return t("discover:people.reasonMutual", {
        count: kisi.mutualFriendsCount,
      });
    }
    if (kisi.sharedSportsCount > 0) {
      return (
        kisi.sharedSportNames[0] ??
        t("discover:people.reasonSports", { count: kisi.sharedSportsCount })
      );
    }
    if (kisi.sameCity && kisi.city) {
      return t("discover:people.reasonCity", { city: kisi.city });
    }
    return t("discover:people.reasonNew");
  };

  const ekle = async (kisi: ExplorePerson) => {
    if (islemdeki) {
      return;
    }

    setIslemdeki(kisi.userId);
    try {
      await sendFriendRequest(kisi.userId);
      setGonderilen((mevcut) => [...mevcut, kisi.userId]);
    } catch (error) {
      // Zaten istek varsa sunucu 409 döner; kullanıcı için sonuç yine aynı.
      if (isApiError(error) && error.status === 409) {
        setGonderilen((mevcut) => [...mevcut, kisi.userId]);
        return;
      }
      showToast({
        type: "error",
        title: t("social:friend.requestFailed"),
        description: getApiErrorMessage(error),
      });
    } finally {
      setIslemdeki(null);
    }
  };

  return (
    <View className="gap-3 pb-1 pt-2">
      <View className="flex-row items-center justify-between px-5">
        <Text className="font-body-bold text-label text-text-primary">
          {t("discover:people.title")}
        </Text>
        <Pressable hitSlop={HIT_SLOP} onPress={onSeeAll}>
          <Text className="font-body-bold text-caption text-brand-primary">
            {t("discover:people.seeAll")}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {people.map((kisi) => {
          const gonderildi = gonderilen.includes(kisi.userId);

          return (
            <Pressable
              key={kisi.userId}
              accessibilityRole="button"
              onPress={() => onOpenProfile(kisi.userId)}
              className="w-[150px] items-center gap-2 rounded-[22px] border border-border-default bg-surface-primary px-3 py-4 active:bg-surface-secondary"
            >
              <Avatar
                uri={kisi.avatarUrl}
                name={kisi.name}
                size={56}
                borderWidth={0}
              />

              <View className="w-full items-center">
                <Text
                  numberOfLines={1}
                  className="w-full text-center font-body-bold text-body-sm text-text-primary"
                >
                  @{displayHandle(kisi.username)}
                </Text>
                <Text
                  numberOfLines={1}
                  className="w-full text-center font-body text-caption text-text-tertiary"
                >
                  {sebep(kisi)}
                </Text>
              </View>

              {/* Kart profile gidiyor, düğme isteği gönderiyor: ikisi ayrı
                  dokunma hedefi, yanlışlıkla istek gitmesin. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("discover:people.addA11y", {
                  name: kisi.name,
                })}
                accessibilityState={{ disabled: gonderildi }}
                disabled={gonderildi || islemdeki === kisi.userId}
                onPress={() => void ekle(kisi)}
                // Dolu lime düğme üç kart yan yanayken akışın önüne geçiyordu;
                // çerçeveli hâli aynı daveti daha sessiz veriyor.
                className={`mt-0.5 w-full flex-row items-center justify-center gap-1.5 rounded-full border px-3 py-2 active:opacity-70 ${
                  gonderildi
                    ? "border-border-default bg-surface-secondary"
                    : "border-brand-primary/60 bg-brand-primary/10"
                }`}
              >
                <FontAwesome6
                  name={gonderildi ? "check" : "plus"}
                  size={11}
                  color={
                    gonderildi
                      ? themeColors.text.tertiary
                      : themeColors.brand.primary
                  }
                />
                <Text
                  numberOfLines={1}
                  className={`font-body-bold text-caption ${
                    gonderildi ? "text-text-tertiary" : "text-brand-primary"
                  }`}
                >
                  {gonderildi
                    ? t("discover:people.sent")
                    : t("discover:people.add")}
                </Text>
              </Pressable>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
