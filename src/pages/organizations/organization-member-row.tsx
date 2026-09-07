import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { UserIdentity } from "@/components";
import { themeColors } from "@/constants/theme";
import i18n, { getCurrentLocale } from "@/i18n";
import {
  ORGANIZATION_ROLE,
  ORGANIZATION_STATUS,
  organizationRoleLabel,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
  canModerateOrganizationMember,
} from "@/types/organizations";

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase(getCurrentLocale());
}

export function memberMatchesSearch(
  member: ApiOrganizationMember,
  query: string,
) {
  const needle = normalizeSearch(query);
  if (!needle) return true;

  const haystack = [
    member.username,
    member.firstName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return normalizeSearch(haystack).includes(needle);
}

export function memberStatusMeta(member: ApiOrganizationMember) {
  if (member.status === ORGANIZATION_STATUS.pending) {
    return i18n.t("organizations:memberStatus.pending");
  }
  if (member.status === ORGANIZATION_STATUS.blocked) {
    return i18n.t("organizations:memberStatus.blocked");
  }
  return organizationRoleLabel(member.role);
}

type MemberActionChipProps = {
  label: string;
  icon: "check" | "xmark" | "user-shield" | "user-minus" | "ban" | "lock-open";
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

function MemberActionChip({
  label,
  icon,
  tone = "default",
  disabled = false,
  loading = false,
  onPress,
}: MemberActionChipProps) {
  const toneClass =
    tone === "primary"
      ? "border-brand-primary/40 bg-brand-primary/10"
      : tone === "danger"
        ? "border-red-400/30 bg-red-500/10"
        : "border-border-default bg-surface-secondary";

  const labelClass =
    tone === "primary"
      ? "text-brand-primary"
      : tone === "danger"
        ? "text-red-300"
        : "text-text-secondary";

  const iconColor =
    tone === "primary"
      ? themeColors.brand.primary
      : tone === "danger"
        ? "#fca5a5"
        : themeColors.text.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={onPress}
      className={`h-8 flex-row items-center gap-1 rounded-full border px-2.5 active:opacity-75 ${toneClass} ${disabled ? "opacity-45" : ""}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <FontAwesome6 name={icon} size={10} color={iconColor} />
      )}
      <Text className={`font-body text-[10px] font-semibold ${labelClass}`}>
        {label}
      </Text>
    </Pressable>
  );
}

type OrganizationMemberRowProps = {
  member: ApiOrganizationMember;
  organization: Pick<
    ApiOrganizationDetail,
    "id" | "myRole" | "canManageMembers" | "canRotateInviteCode"
  >;
  currentUserId?: string;
  busyUserId?: string | null;
  showActions?: boolean;
  onPressProfile: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onToggleAdmin?: () => void;
  onRemove?: () => void;
  onBlock?: () => void;
  onUnblock?: () => void;
};

export function OrganizationMemberRow({
  member,
  organization,
  currentUserId,
  busyUserId,
  showActions = true,
  onPressProfile,
  onApprove,
  onReject,
  onToggleAdmin,
  onRemove,
  onBlock,
  onUnblock,
}: OrganizationMemberRowProps) {
  const { t } = useTranslation(["organizations", "common"]);
  const busy = busyUserId === member.userId;
  const isPending = member.status === ORGANIZATION_STATUS.pending;
  const isBlocked = member.status === ORGANIZATION_STATUS.blocked;
  const isApproved = member.status === ORGANIZATION_STATUS.approved;

  const canModerate =
    organization.canManageMembers
    && isApproved
    && canModerateOrganizationMember(organization.myRole, currentUserId, member);

  const canToggleAdmin =
    organization.canRotateInviteCode
    && isApproved
    && member.role !== ORGANIZATION_ROLE.founder;

  const trailing =
    showActions && organization.canManageMembers ? (
      <View className="shrink-0 flex-row flex-wrap justify-end gap-1">
        {isPending ? (
          <>
            <MemberActionChip
              label={t("organizations:memberRow.approve")}
              icon="check"
              tone="primary"
              disabled={busy}
              loading={busy}
              onPress={() => onApprove?.()}
            />
            <MemberActionChip
              label={t("organizations:memberRow.reject")}
              icon="xmark"
              disabled={busy}
              onPress={() => onReject?.()}
            />
          </>
        ) : null}

        {isBlocked ? (
          <MemberActionChip
            label={t("organizations:memberRow.unblock")}
            icon="lock-open"
            disabled={busy}
            loading={busy}
            onPress={() => onUnblock?.()}
          />
        ) : null}

        {canToggleAdmin ? (
          <MemberActionChip
            label={
              member.role === ORGANIZATION_ROLE.admin
                ? t("organizations:memberRow.makeMember")
                : t("organizations:memberRow.makeAdmin")
            }
            icon="user-shield"
            tone="primary"
            disabled={busy}
            onPress={() => onToggleAdmin?.()}
          />
        ) : null}

        {canModerate ? (
          <>
            <MemberActionChip
              label={t("organizations:memberRow.remove")}
              icon="user-minus"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  t("organizations:memberRow.removeTitle"),
                  t("organizations:memberRow.removeMessage"),
                  [
                    { text: t("common:cancel"), style: "cancel" },
                    {
                      text: t("organizations:memberRow.remove"),
                      style: "destructive",
                      onPress: () => onRemove?.(),
                    },
                  ],
                )
              }
            />
            <MemberActionChip
              label={t("organizations:memberRow.block")}
              icon="ban"
              tone="danger"
              disabled={busy}
              onPress={() =>
                Alert.alert(
                  t("organizations:memberRow.blockTitle"),
                  t("organizations:memberRow.blockMessage"),
                  [
                    { text: t("common:cancel"), style: "cancel" },
                    {
                      text: t("organizations:memberRow.block"),
                      style: "destructive",
                      onPress: () => onBlock?.(),
                    },
                  ],
                )
              }
            />
          </>
        ) : null}
      </View>
    ) : null;

  return (
    <View className="rounded-2xl border border-border-default bg-surface-primary px-3 py-2.5">
      <UserIdentity
        username={member.username}
        avatarUrl={member.profileImageUrl}
        fallbackName={member.firstName}
        meta={memberStatusMeta(member)}
        avatarSize={36}
        onPress={onPressProfile}
        trailing={trailing}
      />
    </View>
  );
}

export const MEMBER_PREVIEW_LIMIT = 5;

export function buildMemberPreview(
  members: ApiOrganizationMember[],
  canManageMembers: boolean,
) {
  const pending = members.filter(
    (member) => member.status === ORGANIZATION_STATUS.pending,
  );
  const approved = members.filter(
    (member) => member.status === ORGANIZATION_STATUS.approved,
  );

  if (!canManageMembers) {
    return approved.slice(0, MEMBER_PREVIEW_LIMIT);
  }

  const preview: ApiOrganizationMember[] = [];
  for (const member of pending) {
    if (preview.length >= MEMBER_PREVIEW_LIMIT) break;
    preview.push(member);
  }
  for (const member of approved) {
    if (preview.length >= MEMBER_PREVIEW_LIMIT) break;
    preview.push(member);
  }

  return preview;
}
