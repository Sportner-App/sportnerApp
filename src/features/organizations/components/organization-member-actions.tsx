import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText as Text, Avatar } from "@/components";
import { HIT_SLOP, themeColors } from "@/constants/theme";
import {
  ORGANIZATION_STATUS,
  type ApiOrganizationMember,
} from "@/features/organizations/types";

const AVATAR_SIZE = 28;
const MAX_AVATARS = 3;

export function OrganizationMemberActions({
  members,
  approvedCount,
  pendingCount,
  onPressMembers,
  inviteEnabled,
  onPressInvite,
}: {
  members: ApiOrganizationMember[];
  approvedCount: number;
  /** Yalnızca yönetici için gösterilir; yoksa 0 ver. */
  pendingCount: number;
  onPressMembers: () => void;
  inviteEnabled: boolean;
  onPressInvite: () => void;
}) {
  const { t } = useTranslation("organizations");
  const avatars = members
    .filter((member) => member.status === ORGANIZATION_STATUS.approved)
    .slice(0, MAX_AVATARS);

  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        accessibilityRole="button"
        onPress={onPressMembers}
        hitSlop={HIT_SLOP}
        className="min-w-0 flex-shrink flex-row items-center gap-3 active:opacity-70"
      >
        {avatars.length > 0 ? (
          <View className="flex-row">
            {avatars.map((member, index) => (
              <Avatar
                key={member.userId}
                uri={member.profileImageUrl}
                name={member.firstName ?? member.username}
                size={AVATAR_SIZE}
                previewable={false}
                borderWidth={2}
                borderColor={themeColors.background.primary}
                style={{ marginLeft: index === 0 ? 0 : -8 }}
              />
            ))}
          </View>
        ) : null}
        <View className="flex-shrink">
          <Text className="font-body-bold text-body-sm text-text-primary">
            {t("detail.memberCount", { count: approvedCount })}
          </Text>
          {pendingCount > 0 ? (
            <Text className="font-body text-caption text-brand-primary">
              {t("detail.pendingCount", { count: pendingCount })}
            </Text>
          ) : null}
        </View>
        <FontAwesome6
          name="chevron-right"
          size={10}
          color={themeColors.text.tertiary}
        />
      </Pressable>
      {inviteEnabled ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressInvite}
          hitSlop={HIT_SLOP}
          className="active:opacity-70"
        >
          <Text className="font-body-bold text-label text-brand-primary">
            {t("detail.inviteAction")}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
