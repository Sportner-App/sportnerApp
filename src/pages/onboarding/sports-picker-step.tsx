import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet, Button } from "@/components";
import {
  ONBOARDING_COPY,
  ONBOARDING_SKILL_OPTIONS,
} from "@/constants/onboarding";
import type { useOnboarding } from "@/hooks/use-onboarding";
import type { OnboardingSportDraft } from "@/types/onboarding";
import type { Sport } from "@/types/sports";
import { sportIconForSlug } from "@/utils/events";

type Form = ReturnType<typeof useOnboarding>;

const GRID_GAP = 10;
const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMNS = 3;

function skillShortLabel(level: number) {
  return (
    ONBOARDING_SKILL_OPTIONS.find((option) => option.level === level)
      ?.shortLabel ?? "—"
  );
}

function SportTile({
  sport,
  isSelected,
  isPrimary,
  onPress,
  width,
}: {
  sport: Sport;
  isSelected: boolean;
  isPrimary: boolean;
  onPress: () => void;
  width: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width }}
      className={`mb-2.5 items-center rounded-2xl border px-2 py-3 active:opacity-85 ${
        isSelected
          ? "border-brand-primary/55 bg-brand-primary/12"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <View
        className={`mb-2 h-11 w-11 items-center justify-center rounded-full ${
          isSelected ? "bg-brand-primary" : "bg-brand-primary/15"
        }`}
      >
        <FontAwesome6
          name={sportIconForSlug(sport.slug)}
          size={15}
          color={isSelected ? "#06111a" : "#ccff00"}
        />
      </View>
      <Text
        numberOfLines={2}
        className="min-h-[32px] text-center font-body text-[12px] font-semibold leading-4 text-text-primary"
      >
        {sport.name}
      </Text>
      {isPrimary ? (
        <View className="mt-1.5 flex-row items-center gap-1">
          <FontAwesome6 name="star" size={9} color="#ccff00" />
          <Text className="font-mono text-[9px] tracking-wide text-brand-primary">
            BİRİNCİL
          </Text>
        </View>
      ) : isSelected ? (
        <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-primary" />
      ) : (
        <View className="mt-1.5 h-1.5" />
      )}
    </Pressable>
  );
}

export function SportsPickerStep({ form }: { form: Form }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const copy = ONBOARDING_COPY.sports;

  const tileWidth = useMemo(() => {
    const available =
      windowWidth - GRID_HORIZONTAL_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1);
    return Math.floor(available / GRID_COLUMNS);
  }, [windowWidth]);

  const selectedMap = useMemo(() => {
    return new Map(form.selected.map((item) => [item.sportId, item]));
  }, [form.selected]);

  return (
    <View className="flex-1" style={{ paddingTop: Math.max(insets.top, 12) }}>
      <Animated.View entering={FadeInDown.duration(400)} className="px-5 pb-3">
        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="h-2.5 w-2.5 rounded-full bg-brand-primary" />
            <Text className="font-mono text-xs tracking-[4px] text-brand-neutral">
              {ONBOARDING_COPY.eyebrow}
            </Text>
          </View>
          <View className="rounded-full border border-brand-primary/25 bg-brand-primary/10 px-3 py-1.5">
            <Text className="font-mono text-[10px] tracking-wide text-brand-primary">
              {copy.stepLabel}
            </Text>
          </View>
        </View>

        <Text className="font-display text-[40px] leading-[44px] text-text-primary">
          {copy.title}
        </Text>
        <Text className="mt-2 font-body text-sm leading-5 text-brand-neutral">
          {copy.subtitle}
        </Text>

        <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4 py-3">
          <FontAwesome6 name="magnifying-glass" size={14} color="#64748b" />
          <TextInput
            value={form.query}
            onChangeText={form.setQuery}
            placeholder={copy.searchPlaceholder}
            placeholderTextColor="#64748b"
            autoCorrect={false}
            autoCapitalize="none"
            className="flex-1 font-body text-base text-text-primary"
          />
          {form.query.length > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => form.setQuery("")}
              className="active:opacity-70"
            >
              <FontAwesome6 name="xmark" size={14} color="#94a3b8" />
            </Pressable>
          ) : null}
        </View>
        {form.isSearchTooShort ? (
          <Text className="mt-2 font-body text-xs text-brand-neutral">
            {copy.searchHint}
          </Text>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(60)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5 pb-3"
        >
          {[
            { key: "all", label: "Tümü" },
            ...form.sportCategories.map((category) => ({
              key: category.id,
              label: category.name,
            })),
          ].map((group) => {
            const active = form.groupKey === group.key;
            return (
              <Pressable
                key={group.key}
                onPress={() => form.setGroupKey(group.key)}
                className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                  active
                    ? "border-brand-primary/50 bg-brand-primary/15"
                    : "border-border-default bg-surface-primary"
                }`}
              >
                <Text
                  className={`font-body text-xs font-semibold ${
                    active ? "text-brand-primary" : "text-brand-neutral"
                  }`}
                >
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      <View className="min-h-0 flex-1 px-4">
        {form.isSportsLoading ? (
          <Text className="mt-6 px-1 font-body text-sm text-brand-neutral">
            Sporlar yükleniyor…
          </Text>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: GRID_GAP,
              paddingTop: 4,
              paddingBottom: 16,
            }}
          >
            {form.filteredSports.length === 0 ? (
              <View className="w-full items-center px-6 py-16">
                <FontAwesome6
                  name="magnifying-glass"
                  size={22}
                  color="#64748b"
                />
                <Text className="mt-3 text-center font-body text-sm text-brand-neutral">
                  Sonuca uygun spor yok. Aramayı veya grubu değiştir.
                </Text>
              </View>
            ) : (
              form.filteredSports.map((sport) => (
                <SportTile
                  key={sport.id}
                  sport={sport}
                  width={tileWidth}
                  isSelected={selectedMap.has(sport.id)}
                  isPrimary={form.primarySportId === sport.id}
                  onPress={() => form.toggleSport(sport)}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      <View
        className="border-t border-border-default bg-background-primary/95 px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-body text-xs text-brand-neutral">
            {form.selected.length > 0
              ? copy.selectedCount(form.selected.length)
              : copy.selectedEmpty}
          </Text>
          {form.selected.length > 0 ? (
            <Text className="font-mono text-[10px] tracking-wide text-brand-primary/80">
              SEVİYE İÇİN DOKUN
            </Text>
          ) : null}
        </View>

        {form.selected.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 pb-3"
          >
            {form.selected.map((draft) => (
              <SelectedSportChip
                key={draft.sportId}
                draft={draft}
                isPrimary={form.primarySportId === draft.sportId}
                isActive={form.editingSportId === draft.sportId}
                onPress={() => form.setEditingSportId(draft.sportId)}
                onRemove={() => {
                  const sport = form.sports.find(
                    (item) => item.id === draft.sportId,
                  );
                  if (sport) {
                    form.toggleSport(sport);
                  }
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="mb-3 h-11 justify-center rounded-2xl border border-dashed border-border-default px-3">
            <Text className="font-body text-xs text-brand-neutral/80">
              Grid’den spor seç — seçtiklerin burada toplanır.
            </Text>
          </View>
        )}

        <Button
          label={copy.submit}
          size="lg"
          isLoading={form.isSubmitting}
          disabled={!form.canContinueSports || form.isSportsLoading}
          onPress={form.goToDetails}
        />
      </View>

      <SportConfigSheet form={form} />
    </View>
  );
}

function SelectedSportChip({
  draft,
  isPrimary,
  isActive,
  onPress,
  onRemove,
}: {
  draft: OnboardingSportDraft;
  isPrimary: boolean;
  isActive: boolean;
  onPress: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-2 rounded-full border px-3 py-2 active:opacity-85 ${
        isActive
          ? "border-brand-primary bg-brand-primary/20"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <FontAwesome6
        name={sportIconForSlug(draft.sportSlug)}
        size={12}
        color="#ccff00"
      />
      <Text className="font-body text-xs font-semibold text-text-primary">
        {draft.sportName}
      </Text>
      <View className="rounded-full bg-white/10 px-1.5 py-0.5">
        <Text className="font-mono text-[10px] text-brand-neutral">
          {skillShortLabel(draft.skillLevel)}
        </Text>
      </View>
      {isPrimary ? (
        <FontAwesome6 name="star" size={10} color="#ccff00" />
      ) : null}
      <Pressable hitSlop={10} onPress={onRemove} className="pl-0.5">
        <FontAwesome6 name="xmark" size={11} color="#94a3b8" />
      </Pressable>
    </Pressable>
  );
}

function SportConfigSheet({ form }: { form: Form }) {
  const draft = form.editingDraft;
  const visible = Boolean(draft);
  const isPrimary = draft ? form.primarySportId === draft.sportId : false;

  return (
    <BottomSheet
      visible={visible}
      onClose={() => form.setEditingSportId(null)}
      title={draft?.sportName ?? "Spor"}
      subtitle="Seviyeni seç ve istersen birincil yap."
      showCancel={false}
    >
      {draft ? (
        <View className="gap-4">
          <View className="gap-2">
            <Text className="font-body text-sm text-brand-neutral">Seviye</Text>
            <View className="flex-row flex-wrap gap-2">
              {ONBOARDING_SKILL_OPTIONS.map((option) => {
                const active = draft.skillLevel === option.level;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() =>
                      form.setSportSkill(draft.sportId, option.level)
                    }
                    className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
                      active
                        ? "border-brand-primary bg-brand-primary"
                        : "border-border-default bg-background-secondary"
                    }`}
                  >
                    <Text
                      className={`font-body text-xs font-semibold ${
                        active ? "text-brand-secondary" : "text-text-primary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => form.setPrimarySportId(draft.sportId)}
            className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-85 ${
              isPrimary
                ? "border-brand-primary/45 bg-brand-primary/12"
                : "border-border-default bg-background-secondary"
            }`}
          >
            <FontAwesome6
              name="star"
              size={14}
              color={isPrimary ? "#ccff00" : "#64748b"}
            />
            <View className="flex-1">
              <Text className="font-body text-sm font-semibold text-text-primary">
                Birincil spor
              </Text>
              <Text className="mt-0.5 font-body text-xs text-brand-neutral">
                Profilinde ve önerilerde öne çıkar.
              </Text>
            </View>
            {isPrimary ? (
              <FontAwesome6 name="circle-check" size={16} color="#ccff00" />
            ) : null}
          </Pressable>

          <Button label="Tamam" onPress={() => form.setEditingSportId(null)} />
        </View>
      ) : null}
    </BottomSheet>
  );
}
