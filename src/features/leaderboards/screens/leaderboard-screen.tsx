import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from "react-native";

import {
  AppScreen,
  AppText as Text,
  Avatar,
  ScreenHeader,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { palette, themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import {
  getDistrictLeaderboard,
  getMyDistrictStanding,
  listDistricts,
} from "@/features/leaderboards/services/leaderboards-service";
import {
  LEADERBOARD_PERIOD,
  type DistrictLeaderboard,
  type DistrictSummary,
  type LeaderboardEntry,
} from "@/features/leaderboards/types";
import {
  getLeaderboardVisibility,
  updateLeaderboardVisibility,
} from "@/features/profile/services/profile-service";
import { useSportCatalog } from "@/features/sports/hooks/use-sport-catalog";
import { sportIconForSlug } from "@/features/sports/sports";

type PeriodKey = "month" | "allTime";

/** İlk üçün madalya tonları; geri kalanı düz numara. */
const PODIUM_ICON_COLORS = [palette.lime, palette.ink, palette.inkMuted];

export function LeaderboardScreen() {
  const { t } = useTranslation("leaderboards");
  const router = useRouter();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ city?: string; district?: string }>();
  const { sports } = useSportCatalog();

  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [selected, setSelected] = useState<{ city: string; district: string } | null>(
    params.city && params.district
      ? { city: params.city, district: params.district }
      : null,
  );
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [sportId, setSportId] = useState<string | null>(null);
  const [board, setBoard] = useState<DistrictLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    void Promise.all([
      listDistricts(params.city),
      selected ? Promise.resolve(null) : getMyDistrictStanding(),
      getLeaderboardVisibility(),
    ])
      .then(([list, standing, isVisible]) => {
        setDistricts(list);
        setVisible(isVisible);
        if (!selected) {
          const fallback = standing ?? list[0];
          if (fallback) {
            setSelected({ city: fallback.city, district: fallback.district });
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
    // Yalnızca açılışta: semt seçimi sonrası yeniden yüklenmiyor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    setIsBoardLoading(true);
    void getDistrictLeaderboard({
      ...selected,
      period: period === "month" ? LEADERBOARD_PERIOD.month : LEADERBOARD_PERIOD.allTime,
      sportId,
    })
      .then(setBoard)
      .catch(() => setBoard(null))
      .finally(() => setIsBoardLoading(false));
  }, [selected, period, sportId, visible]);

  const sportOptions = useMemo(
    () => [...sports].sort((a, b) => a.name.localeCompare(b.name)),
    [sports],
  );

  const toggleVisibility = async (next: boolean) => {
    setVisible(next);
    try {
      await updateLeaderboardVisibility(next);
    } catch {
      setVisible(!next);
      showToast({ type: "error", title: t("visibility.failed") });
    }
  };

  const openUser = (userId: string) => router.push(`/users/${userId}`);
  const meInTop = board?.me
    ? board.entries.some((entry) => entry.userId === board.me?.userId)
    : false;
  const enoughPlayers = board ? board.totalPlayers >= board.minPlayers : false;

  return (
    <AppScreen
      header={<ScreenHeader title={t("title")} showBack />}
      contentClassName="gap-4 px-6 pt-3"
    >
      {isLoading ? (
        <ScreenLoader label={t("loading")} />
      ) : !selected ? (
        <Text className="text-body-sm text-text-tertiary">{t("noDistricts")}</Text>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {districts.map((item) => {
              const active =
                item.district === selected.district && item.city === selected.city;
              return (
                <Pressable
                  key={`${item.city}-${item.district}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelected({ city: item.city, district: item.district })}
                  className={`rounded-full border px-4 py-2 ${
                    active
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-default bg-surface-secondary"
                  }`}
                >
                  <Text
                    className={`font-body-bold text-caption ${
                      active ? "text-text-inverse" : "text-text-primary"
                    }`}
                    style={active ? { color: palette.canvas } : undefined}
                  >
                    {item.district}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <SegmentedTabs<PeriodKey>
            options={[
              { key: "month", label: t("period.month") },
              { key: "allTime", label: t("period.allTime") },
            ]}
            value={period}
            onChange={setPeriod}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <SportChip
              label={t("allSports")}
              active={sportId === null}
              onPress={() => setSportId(null)}
            />
            {sportOptions.map((sport) => (
              <SportChip
                key={sport.id}
                label={sport.name}
                icon={sportIconForSlug(sport.slug)}
                active={sportId === sport.id}
                onPress={() => setSportId(sport.id)}
              />
            ))}
          </ScrollView>

          <View className="flex-row items-center gap-2">
            <FontAwesome6 name="crown" size={14} color={themeColors.brand.primary} />
            <Text className="font-display text-heading-sm text-text-primary">
              {t("heading", { district: selected.district })}
            </Text>
          </View>

          {isBoardLoading && !board ? (
            <ActivityIndicator color={themeColors.brand.primary} />
          ) : !board || !enoughPlayers ? (
            <View className="items-center gap-2 rounded-[22px] border border-dashed border-border-default p-6">
              <FontAwesome6 name="flag-checkered" size={20} color={themeColors.brand.primary} />
              <Text className="text-center font-body-bold text-body text-text-primary">
                {t("empty.title")}
              </Text>
              <Text className="text-center text-caption text-text-secondary">
                {t("empty.body", {
                  district: selected.district,
                  count: Math.max(0, (board?.minPlayers ?? 3) - (board?.totalPlayers ?? 0)),
                })}
              </Text>
            </View>
          ) : (
            <View className="gap-1 rounded-[22px] border border-border-default bg-surface-secondary p-2">
              {board.entries.map((entry) => (
                <EntryRow
                  key={entry.userId}
                  entry={entry}
                  isMe={entry.userId === board.me?.userId}
                  onPress={() => openUser(entry.userId)}
                />
              ))}
              {board.me && !meInTop ? (
                <>
                  <View className="mx-3 my-1 h-px bg-border-default" />
                  <EntryRow entry={board.me} isMe onPress={() => openUser(board.me!.userId)} />
                </>
              ) : null}
            </View>
          )}

          <Text className="text-overline text-text-tertiary">{t("rules")}</Text>

          <View className="flex-row items-center gap-3 rounded-2xl bg-surface-secondary p-4">
            <View className="flex-1 gap-0.5">
              <Text className="font-body-bold text-body-sm text-text-primary">
                {t("visibility.title")}
              </Text>
              <Text className="text-caption text-text-tertiary">
                {t("visibility.description")}
              </Text>
            </View>
            <Switch
              value={visible}
              onValueChange={(next) => void toggleVisibility(next)}
              trackColor={{
                false: themeColors.surface.secondary,
                true: themeColors.brand.primary,
              }}
              thumbColor={themeColors.background.primary}
            />
          </View>
        </>
      )}
    </AppScreen>
  );
}

function SportChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: ReturnType<typeof sportIconForSlug>;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
        active ? "bg-brand-primary/20" : "bg-surface-secondary"
      }`}
    >
      {icon ? (
        <FontAwesome6
          name={icon}
          size={11}
          color={active ? themeColors.brand.primary : themeColors.text.tertiary}
        />
      ) : null}
      <Text
        className={`font-body-bold text-overline ${
          active ? "text-brand-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EntryRow({
  entry,
  isMe,
  onPress,
}: {
  entry: LeaderboardEntry;
  isMe: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation("leaderboards");
  const podiumColor = PODIUM_ICON_COLORS[entry.rank - 1];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl px-3 py-2.5 active:opacity-70 ${
        isMe ? "bg-brand-primary/10" : ""
      }`}
    >
      <View className="w-7 items-center">
        {entry.rank === 1 ? (
          <FontAwesome6 name="crown" size={15} color={palette.lime} />
        ) : podiumColor ? (
          <FontAwesome6 name="medal" size={15} color={podiumColor} />
        ) : (
          <Text className="font-body-bold text-caption text-text-tertiary">
            {entry.rank}
          </Text>
        )}
      </View>
      <Avatar uri={entry.profileImageUrl} name={entry.fullName} size={36} />
      <View className="flex-1">
        <Text numberOfLines={1} className="font-body-bold text-body-sm text-text-primary">
          {isMe ? t("you") : entry.fullName}
        </Text>
        <Text numberOfLines={1} className="text-overline text-text-tertiary">
          @{entry.username}
        </Text>
      </View>
      <Text className="font-display text-body text-text-primary">
        {t("games", { count: entry.eventCount })}
      </Text>
    </Pressable>
  );
}
