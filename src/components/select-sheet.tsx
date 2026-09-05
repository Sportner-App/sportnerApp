import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { BottomSheet } from "@/components/bottom-sheet";
import { sportAccentToken, themeColors } from "@/constants/theme";
import type { SelectOption, SelectSheetProps } from "@/types/components";

const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const SHEET_HORIZONTAL_PADDING = 20;

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function filterOptions<T extends string>(
  options: SelectOption<T>[],
  query: string,
  groupKey: string | null,
) {
  const needle = normalizeSearch(query);

  return options.filter((option) => {
    // Grubu olmayan seçenekler (ör. "Tüm sporlar") her zaman görünür kalır.
    const matchesGroup =
      groupKey === null || !option.groupKey || option.groupKey === groupKey;

    const matchesQuery =
      !needle || normalizeSearch(option.label).includes(needle);

    return matchesGroup && matchesQuery;
  });
}

export function SelectSheet<T extends string>({
  visible,
  onClose,
  title,
  subtitle,
  options,
  value,
  onChange,
  variant = "list",
  searchable = false,
  searchPlaceholder = "Ara…",
  groups,
  allGroupLabel = "Tümü",
}: SelectSheetProps<T>) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setActiveGroup(null);
      setKeyboardInset(0);
      return;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardInset(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardInset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const listMaxHeight = useMemo(() => {
    const base = variant === "grid" ? 420 : 320;
    if (!searchable || keyboardInset <= 0) {
      return base;
    }

    const reserved = keyboardInset + 220;
    return Math.max(140, Math.min(base, windowHeight - reserved));
  }, [keyboardInset, searchable, variant, windowHeight]);

  const filtered = useMemo(
    () => filterOptions(options, query, activeGroup),
    [activeGroup, options, query],
  );

  const tileWidth = useMemo(() => {
    const available =
      windowWidth -
      SHEET_HORIZONTAL_PADDING * 2 -
      GRID_GAP * (GRID_COLUMNS - 1);
    return Math.floor(available / GRID_COLUMNS);
  }, [windowWidth]);

  const select = (key: T) => {
    onChange(key);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
    >
      {searchable ? (
        <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3">
          <FontAwesome6
            name="magnifying-glass"
            size={14}
            color={themeColors.text.tertiary}
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={searchPlaceholder}
            placeholderTextColor={themeColors.text.tertiary}
            autoCorrect={false}
            autoCapitalize="none"
            className="flex-1 font-body text-base text-text-primary"
          />
          {query.length > 0 ? (
            <Pressable
              hitSlop={8}
              onPress={() => setQuery("")}
              className="active:opacity-70"
            >
              <FontAwesome6
                name="xmark"
                size={14}
                color={themeColors.text.secondary}
              />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {groups && groups.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-2 pb-3 pr-4"
        >
          <GroupChip
            label={allGroupLabel}
            isActive={activeGroup === null}
            onPress={() => setActiveGroup(null)}
          />
          {groups.map((group) => (
            <GroupChip
              key={group.key}
              label={group.label}
              isActive={activeGroup === group.key}
              onPress={() =>
                setActiveGroup((current) =>
                  current === group.key ? null : group.key,
                )
              }
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        style={{ maxHeight: listMaxHeight }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {filtered.length === 0 ? (
          <View className="items-center px-4 py-10">
            <FontAwesome6
              name="magnifying-glass"
              size={20}
              color={themeColors.text.tertiary}
            />
            <Text className="mt-3 text-center font-body text-sm text-text-secondary">
              Sonuca uygun seçenek yok.
            </Text>
          </View>
        ) : variant === "grid" ? (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: GRID_GAP,
            }}
          >
            {filtered.map((option) => (
              <GridTile
                key={option.key}
                option={option}
                isActive={option.key === value}
                width={tileWidth}
                onPress={() => select(option.key)}
              />
            ))}
          </View>
        ) : (
          <View className="gap-2">
            {filtered.map((option) => (
              <ListRow
                key={option.key}
                option={option}
                isActive={option.key === value}
                onPress={() => select(option.key)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function GroupChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      onPress={onPress}
      className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
        isActive
          ? "border-brand-primary/50 bg-brand-primary/15"
          : "border-border-default bg-surface-primary"
      }`}
    >
      <Text
        className={`font-body text-xs font-semibold ${
          isActive ? "text-brand-primary" : "text-text-secondary"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ListRow<T extends string>({
  option,
  isActive,
  onPress,
}: {
  option: SelectOption<T>;
  isActive: boolean;
  onPress: () => void;
}) {
  const sport = sportAccentToken(option.key);
  const accent = sport?.accent ?? themeColors.brand.primary;
  const soft = sport?.soft ?? themeColors.surface.secondary;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3.5 active:opacity-80 ${
        isActive
          ? "border-brand-primary/50 bg-brand-primary/10"
          : "border-border-default bg-surface-primary"
      }`}
    >
      {option.icon ? (
        <View
          className="h-10 w-10 items-center justify-center rounded-full border"
          style={{ backgroundColor: soft, borderColor: `${accent}55` }}
        >
          <FontAwesome6 name={option.icon} size={16} color={accent} />
        </View>
      ) : null}

      <View className="flex-1">
        <Text
          className={`font-body text-sm font-semibold ${
            isActive ? "text-brand-primary" : "text-text-primary"
          }`}
        >
          {option.label}
        </Text>
        {option.description ? (
          <Text className="mt-0.5 font-body text-xs text-text-secondary">
            {option.description}
          </Text>
        ) : null}
      </View>

      {isActive ? (
        <FontAwesome6
          name="check"
          size={14}
          color={themeColors.brand.primary}
        />
      ) : (
        <FontAwesome6
          name="chevron-right"
          size={12}
          color={themeColors.text.tertiary}
        />
      )}
    </Pressable>
  );
}

function GridTile<T extends string>({
  option,
  isActive,
  width,
  onPress,
}: {
  option: SelectOption<T>;
  isActive: boolean;
  width: number;
  onPress: () => void;
}) {
  const sport = sportAccentToken(option.key);
  const accent = sport?.accent ?? themeColors.brand.primary;
  const soft = sport?.soft ?? themeColors.surface.secondary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width,
          backgroundColor: isActive ? soft : themeColors.surface.primary,
          borderColor: isActive ? accent : themeColors.border.default,
        },
        isActive
          ? {
              shadowColor: accent,
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }
          : undefined,
      ]}
      className="relative min-h-[118px] items-center justify-center rounded-[22px] border px-2 py-3 active:opacity-85"
    >
      {isActive ? (
        <View
          className="absolute right-2 top-2 h-5 w-5 items-center justify-center rounded-full"
          style={{ backgroundColor: accent }}
        >
          <FontAwesome6
            name="check"
            size={9}
            color={sport?.onAccent ?? themeColors.text.onPrimary}
          />
        </View>
      ) : null}
      <View
        className="mb-2 h-12 w-12 items-center justify-center rounded-full border"
        style={{
          backgroundColor: isActive ? accent : soft,
          borderColor: `${accent}66`,
        }}
      >
        <FontAwesome6
          name={option.icon ?? "circle"}
          size={17}
          color={
            isActive ? (sport?.onAccent ?? themeColors.text.onPrimary) : accent
          }
        />
      </View>
      <Text
        numberOfLines={2}
        className="min-h-[32px] text-center font-body-bold text-[12px] leading-4 text-text-primary"
      >
        {option.label}
      </Text>
    </Pressable>
  );
}
