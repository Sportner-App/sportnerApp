import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, Text, View } from "react-native";

import { SelectField } from "@/components";
import { themeColors } from "@/constants/theme";
import type { ApiOrganizationListItem } from "@/types/organizations";

type OrganizationSelectStepProps = {
  isLocked: boolean;
  lockedOrganizationName?: string;
  wantsOrganizationEvent: boolean;
  onIntentChange: (wants: boolean) => void;
  organizations: ApiOrganizationListItem[];
  organizationId?: string;
  onOrganizationChange: (organizationId: string) => void;
  disabled?: boolean;
};

export function OrganizationSelectStep({
  isLocked,
  lockedOrganizationName,
  wantsOrganizationEvent,
  onIntentChange,
  organizations,
  organizationId,
  onOrganizationChange,
  disabled = false,
}: OrganizationSelectStepProps) {
  if (isLocked) {
    return (
      <View className="mt-7 flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-primary p-4">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10">
          <FontAwesome6
            name="building"
            size={13}
            color={themeColors.brand.primary}
          />
        </View>
        <Text className="flex-1 font-body text-sm text-text-secondary">
          Bu etkinlik{" "}
          <Text className="font-body-bold text-text-primary">
            {lockedOrganizationName ?? "organizasyonun"}
          </Text>{" "}
          organizasyonuna bağlı olarak oluşturuluyor.
        </Text>
      </View>
    );
  }

  if (organizations.length === 0) {
    return null;
  }

  return (
    <View className="mt-7 gap-3">
      <Text className="font-body-bold text-[13px] text-text-secondary">
        Bu etkinlik bir organizasyona mı bağlı?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          disabled={disabled}
          onPress={() => onIntentChange(false)}
          className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
            !wantsOrganizationEvent
              ? "border-brand-primary bg-brand-primary"
              : "border-border-default bg-surface-primary"
          }`}
        >
          <Text
            className={`font-body-bold text-sm ${
              !wantsOrganizationEvent
                ? "text-background-primary"
                : "text-text-secondary"
            }`}
          >
            Bireysel etkinlik
          </Text>
        </Pressable>
        <Pressable
          disabled={disabled}
          onPress={() => onIntentChange(true)}
          className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
            wantsOrganizationEvent
              ? "border-brand-primary bg-brand-primary"
              : "border-border-default bg-surface-primary"
          }`}
        >
          <Text
            className={`font-body-bold text-sm ${
              wantsOrganizationEvent
                ? "text-background-primary"
                : "text-text-secondary"
            }`}
          >
            Organizasyon etkinliği
          </Text>
        </Pressable>
      </View>

      {wantsOrganizationEvent ? (
        <SelectField
          label="Organizasyon"
          placeholder="Organizasyon seç"
          sheetTitle="Organizasyon seç"
          sheetSubtitle="Etkinliği hangi organizasyon adına oluşturuyorsun?"
          icon="building"
          value={organizationId ?? ""}
          onChange={onOrganizationChange}
          options={organizations.map((organization) => ({
            key: organization.id,
            label: organization.name,
          }))}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}
