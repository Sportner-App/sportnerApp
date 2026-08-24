import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AppScreen, ScreenHeader } from "@/components";
import { ONBOARDING_SKILL_OPTIONS } from "@/constants/onboarding";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { addMySportSafe } from "@/services/onboarding-service";
import { listSports } from "@/services/sports-service";
import type { Sport } from "@/types/sports";

export function AddSportScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [sports, setSports] = useState<Sport[]>([]);
  const [selected, setSelected] = useState<Sport | null>(null);
  const [level, setLevel] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void listSports().then(setSports);
  }, []);

  const filtered = sports.filter((sport) =>
    sport.name.toLocaleLowerCase("tr-TR").includes(query.trim().toLocaleLowerCase("tr-TR")),
  );

  const save = async () => {
    if (!selected || saving) {
      return;
    }
    setSaving(true);
    try {
      await addMySportSafe({
        sportId: selected.id,
        skillLevel: level,
      });
      showToast({ type: "success", title: "Spor eklendi" });
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
      contentClassName="gap-4 px-6 pt-3"
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Spor ara…"
        placeholderTextColor="#64748b"
        className="rounded-2xl border border-white/10 bg-brand-surface/90 px-4 py-3 font-body text-base text-white"
      />

      {filtered.slice(0, 20).map((sport) => {
        const active = selected?.id === sport.id;
        return (
          <Pressable
            key={sport.id}
            onPress={() => setSelected(sport)}
            className={`rounded-2xl border px-4 py-3 ${
              active
                ? "border-brand-primary/50 bg-brand-primary/10"
                : "border-white/10 bg-brand-surface/90"
            }`}
          >
            <Text className="font-body text-sm font-semibold text-white">
              {sport.name}
            </Text>
          </Pressable>
        );
      })}

      {selected ? (
        <View className="flex-row flex-wrap gap-2">
          {ONBOARDING_SKILL_OPTIONS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setLevel(option.level)}
              className={`rounded-full border px-3 py-1.5 ${
                level === option.level
                  ? "border-brand-primary bg-brand-primary"
                  : "border-white/10"
              }`}
            >
              <Text
                className={`font-body text-xs ${
                  level === option.level ? "text-brand-secondary" : "text-white"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        disabled={!selected || saving}
        onPress={save}
        className="items-center rounded-2xl bg-brand-primary py-4 disabled:opacity-50"
      >
        <Text className="font-body font-semibold text-brand-secondary">
          {saving ? "Ekleniyor…" : "Ekle"}
        </Text>
      </Pressable>
    </AppScreen>
  );
}
