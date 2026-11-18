import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppText as Text,
  AppTextInput,
  Avatar,
  BottomSheet,
  Button,
} from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import type { ClubMembersStatus } from "@/features/events/hooks/use-event-companions";
import { memberMatchesSearch } from "@/features/organizations/components/organization-member-row";
import type { ApiOrganizationMember } from "@/features/organizations/types";
import { formatHandle } from "@/utils/person";

type Props = {
  visible: boolean;
  onClose: () => void;
  members: ApiOrganizationMember[];
  status: ClubMembersStatus;
  selected: ApiOrganizationMember[];
  /** Onaylanmış seçim dahil, toplamda seçilebilecek en fazla üye. */
  maxSelectable: number;
  onRetry: () => void;
  onConfirm: (members: ApiOrganizationMember[]) => void;
};

export function ClubMemberPickerSheet({
  visible,
  onClose,
  members,
  status,
  selected,
  maxSelectable,
  onRetry,
  onConfirm,
}: Props) {
  const { t } = useTranslation("eventCreate");
  const [query, setQuery] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>([]);

  // Sheet her açıldığında taslak, onaylanmış seçimden başlar.
  useEffect(() => {
    if (visible) {
      setDraftIds(selected.map((member) => member.userId));
      setQuery("");
    }
    // Yalnızca açılışta eşitlenir; açıkken dış seçim değişmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const filtered = useMemo(
    () => members.filter((member) => memberMatchesSearch(member, query)),
    [members, query],
  );
  const isFull = draftIds.length >= maxSelectable;

  const toggle = (userId: string) => {
    setDraftIds((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      if (current.length >= maxSelectable) return current;
      return [...current, userId];
    });
  };

  const confirm = () => {
    const byId = new Map(members.map((member) => [member.userId, member]));
    onConfirm(
      draftIds
        .map((id) => byId.get(id))
        .filter((member): member is ApiOrganizationMember => Boolean(member)),
    );
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("companions.memberSheetTitle")}
      showCancel={false}
      footer={
        <Button
          label={
            draftIds.length > 0
              ? t("companions.memberConfirm", { count: draftIds.length })
              : t("companions.memberDone")
          }
          onPress={confirm}
          disabled={status !== "ready"}
        />
      }
    >
      <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3">
        <FontAwesome6
          name="magnifying-glass"
          size={14}
          color={themeColors.text.tertiary}
        />
        <AppTextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("companions.memberSearchPlaceholder")}
          placeholderTextColor={themeColors.text.tertiary}
          autoCorrect={false}
          autoCapitalize="none"
          className="flex-1 font-body text-body text-text-primary"
        />
        {query.length > 0 ? (
          <Pressable hitSlop={HIT_SLOP} onPress={() => setQuery("")}>
            <FontAwesome6
              name="xmark"
              size={14}
              color={themeColors.text.secondary}
            />
          </Pressable>
        ) : null}
      </View>

      {isFull ? (
        <Text className="mb-2 font-body text-caption text-text-tertiary">
          {t("companions.membersCapacityFull")}
        </Text>
      ) : null}

      {status === "loading" || status === "idle" ? (
        <View className="items-center py-10">
          <ActivityIndicator color={themeColors.brand.primary} />
        </View>
      ) : status === "error" ? (
        <View className="items-center gap-3 py-8">
          <Text className="text-center font-body text-body-sm text-text-secondary">
            {t("companions.membersError")}
          </Text>
          <Button
            label={t("companions.membersRetry")}
            variant="outline"
            size="sm"
            onPress={onRetry}
          />
        </View>
      ) : members.length === 0 ? (
        <Text className="px-4 py-10 text-center font-body text-body-sm text-text-secondary">
          {t("companions.membersEmpty")}
        </Text>
      ) : filtered.length === 0 ? (
        <Text className="px-4 py-10 text-center font-body text-body-sm text-text-secondary">
          {t("companions.membersNoResults")}
        </Text>
      ) : (
        <View className="gap-2">
          {filtered.map((member) => {
            const isSelected = draftIds.includes(member.userId);
            const disabled = !isSelected && isFull;
            return (
              <Pressable
                key={member.userId}
                disabled={disabled}
                onPress={() => toggle(member.userId)}
                className={`flex-row items-center gap-3 rounded-2xl border px-3.5 py-2.5 disabled:opacity-35 ${
                  isSelected
                    ? "border-brand-primary/50 bg-brand-primary/10"
                    : "border-border-default bg-surface-primary"
                }`}
              >
                <Avatar
                  uri={member.profileImageUrl}
                  name={member.firstName || member.username || ""}
                  size={40}
                  borderWidth={0}
                />
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-bold text-body-sm text-text-primary"
                  >
                    {formatHandle(member.username)}
                  </Text>
                  {member.firstName || member.lastName ? (
                    <Text
                      numberOfLines={1}
                      className="mt-0.5 font-body text-overline text-text-secondary"
                    >
                      {[member.firstName, member.lastName]
                        .filter(Boolean)
                        .join(" ")}
                    </Text>
                  ) : null}
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-brand-primary bg-brand-primary"
                      : "border-border-strong bg-transparent"
                  }`}
                >
                  {isSelected ? (
                    <FontAwesome6
                      name="check"
                      size={10}
                      color={themeColors.text.onPrimary}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </BottomSheet>
  );
}
