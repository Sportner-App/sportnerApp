import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import { AppScreen, Button, ScreenHeader } from "@/components";
import { ONBOARDING_SKILL_OPTIONS } from "@/constants/onboarding";
import { useToast } from "@/contexts";
import { useProfile } from "@/hooks/use-profile";
import { getApiErrorMessage } from "@/lib/api/errors";
import { addMySports } from "@/services/onboarding-service";
import { listSports } from "@/services/sports-service";
import type { Sport } from "@/types/sports";
import { sportIconForSlug } from "@/utils/events";

export function AddSportScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { profile, refresh } = useProfile();
  const [query, setQuery] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [selected, setSelected] = useState<
    Record<string, { sport: Sport; level: number }>
  >({});
  const [activeSportId, setActiveSportId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listSports().then(setSports);
  }, []);

  const currentSportIds = new Set(
    profile?.sports.map((sport) => sport.sportId) ?? [],
  );
  const filtered = sports.filter(
    (sport) =>
      !currentSportIds.has(sport.id) &&
      sport.name
        .toLocaleLowerCase("tr-TR")
        .includes(query.trim().toLocaleLowerCase("tr-TR")),
  );
  const selectedSports = Object.values(selected);
  const activeSelection = activeSportId ? selected[activeSportId] : undefined;

  const toggleSport = (sport: Sport) => {
    if (selected[sport.id]) {
      const next = { ...selected };
      delete next[sport.id];
      setSelected(next);
      if (activeSportId === sport.id) {
        setActiveSportId(Object.keys(next)[0] ?? null);
      }
      return;
    }

    setSelected((current) => ({
      ...current,
      [sport.id]: { sport, level: 1 },
    }));
    setActiveSportId(sport.id);
  };

  const setSportLevel = (sportId: string, level: number) => {
    setSelected((current) => ({
      ...current,
      [sportId]: { ...current[sportId], level },
    }));
  };

  const save = async () => {
    if (selectedSports.length === 0 || saving) {
      return;
    }
    setSaving(true);
    try {
      await addMySports(
        selectedSports.map(({ sport, level }) => ({
          sportId: sport.id,
          skillLevel: level,
        })),
      );
      await refresh();
      showToast({
        type: "success",
        title:
          selectedSports.length === 1
            ? "Spor eklendi"
            : `${selectedSports.length} spor eklendi`,
      });
      router.back();
    } catch (error) {
      showToast({
        type: "error",
        title: "Eklenemedi",
        description: getApiErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      header={<ScreenHeader title="SPOR EKLE" showBack />}
      contentClassName="gap-5 px-5 pt-3"
    >
      <View className="gap-1 px-1">
        <Text className="font-display text-3xl text-text-primary">
          Seni harekete geçiren ne?
        </Text>
        <Text className="font-body text-sm leading-5 text-text-secondary">
          Sporunu seç, seviyeni belirle ve profilini tamamla.
        </Text>
      </View>

      <View className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary px-4">
        <FontAwesome6 name="magnifying-glass" size={13} color="#6f7d86" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Spor ara…"
          placeholderTextColor="#64748b"
          className="min-h-[52px] flex-1 font-body text-base text-text-primary"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <FontAwesome6 name="circle-xmark" size={15} color="#6f7d86" />
          </Pressable>
        ) : null}
      </View>

      {selectedSports.length > 0 ? (
        <View className="gap-4 rounded-[22px] border border-brand-primary/30 bg-brand-primary/5 p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-display text-lg text-text-primary">
                Takımın şekilleniyor
              </Text>
              <Text className="mt-1 font-body text-xs text-text-tertiary">
                Her spor için seviyeni seç.
              </Text>
            </View>
            <View className="rounded-full bg-brand-primary px-2.5 py-1">
              <Text className="font-mono-bold text-[10px] text-brand-secondary">
                {selectedSports.length} SEÇİLDİ
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            contentContainerClassName="gap-2"
            showsHorizontalScrollIndicator={false}
          >
            {selectedSports.map(({ sport }) => {
              const active = activeSportId === sport.id;
              return (
                <View
                  key={sport.id}
                  className={`flex-row items-center rounded-full border pl-1.5 pr-2 ${
                    active
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-border-default bg-background-secondary"
                  }`}
                >
                  <Pressable
                    onPress={() => setActiveSportId(sport.id)}
                    className="flex-row items-center gap-2 py-1.5 pl-0.5 pr-2"
                  >
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-primary/15">
                      <FontAwesome6
                        name={sportIconForSlug(sport.slug)}
                        size={10}
                        color="#ccff00"
                      />
                    </View>
                    <Text className="font-body text-xs font-semibold text-text-primary">
                      {sport.name}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => toggleSport(sport)}
                    hitSlop={6}
                    accessibilityLabel={`${sport.name} seçimini kaldır`}
                    className="h-6 w-6 items-center justify-center"
                  >
                    <FontAwesome6 name="xmark" size={11} color="#6f7d86" />
                  </Pressable>
                </View>
              );
            })}
          </ScrollView>

          {activeSelection ? (
            <View className="gap-3 rounded-2xl bg-background-secondary px-3 py-3">
              <View className="flex-row items-center gap-2">
                <FontAwesome6
                  name={sportIconForSlug(activeSelection.sport.slug)}
                  size={12}
                  color="#ccff00"
                />
                <Text className="font-body text-sm font-semibold text-text-primary">
                  {activeSelection.sport.name} seviyen
                </Text>
                <Text className="ml-auto font-body text-[10px] text-text-tertiary">
                  Değiştirmek için dokun
                </Text>
              </View>
              <ScrollView
                horizontal
                contentContainerClassName="gap-2"
                showsHorizontalScrollIndicator={false}
              >
                {ONBOARDING_SKILL_OPTIONS.map((option) => (
                  <Pressable
                    key={option.key}
                    onPress={() =>
                      setSportLevel(activeSelection.sport.id, option.level)
                    }
                    className={`rounded-full border px-3 py-2 ${
                      activeSelection.level === option.level
                        ? "border-brand-primary bg-brand-primary"
                        : "border-border-default bg-surface-primary"
                    }`}
                  >
                    <Text
                      className={`font-body text-xs font-semibold ${
                        activeSelection.level === option.level
                          ? "text-brand-secondary"
                          : "text-text-primary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Button
            label={
              saving
                ? "Ekleniyor…"
                : `${selectedSports.length} sporu profilime ekle`
            }
            disabled={saving}
            isLoading={saving}
            onPress={() => void save()}
          />
        </View>
      ) : (
        <View className="flex-row items-center gap-3 rounded-[20px] border border-dashed border-border-strong px-4 py-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10">
            <FontAwesome6 name="plus" size={13} color="#ccff00" />
          </View>
          <View className="flex-1">
            <Text className="font-display text-lg text-text-primary">
              Birden fazla seçebilirsin
            </Text>
            <Text className="mt-1 font-body text-xs text-text-tertiary">
              Spor kartlarına dokun, sonra seviyelerini belirle.
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {filtered.slice(0, 20).map((sport) => {
          const active = Boolean(selected[sport.id]);
          return (
            <Pressable
              key={sport.id}
              onPress={() => toggleSport(sport)}
              className={`w-[48.5%] items-center gap-3 rounded-[22px] border px-3 py-5 active:opacity-75 ${
                active
                  ? "border-brand-primary bg-brand-primary/10"
                  : "border-border-default bg-surface-primary"
              }`}
            >
              <View
                className={`h-12 w-12 items-center justify-center rounded-full ${
                  active ? "bg-brand-primary" : "bg-background-secondary"
                }`}
              >
                <FontAwesome6
                  name={sportIconForSlug(sport.slug)}
                  size={18}
                  color={active ? "#06111a" : "#ccff00"}
                />
              </View>
              <Text className="text-center font-body text-sm font-semibold text-text-primary">
                {sport.name}
              </Text>
              {active ? (
                <View className="absolute right-3 top-3">
                  <FontAwesome6 name="circle-check" size={15} color="#ccff00" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View className="items-center gap-2 rounded-[22px] border border-dashed border-border-strong px-5 py-8">
          <FontAwesome6 name="person-running" size={22} color="#ccff00" />
          <Text className="font-body text-sm text-text-secondary">
            Eklenecek spor bulunamadı.
          </Text>
        </View>
      ) : null}
    </AppScreen>
  );
}
