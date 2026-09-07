import i18n from "@/i18n";

export const ORGANIZATION_ROLE = {
  founder: 0,
  admin: 1,
  member: 2,
} as const;

export const ORGANIZATION_STATUS = {
  pending: 0,
  approved: 1,
  rejected: 2,
  left: 3,
  blocked: 4,
} as const;

export type ApiOrganizationListItem = {
  id: string;
  name: string;
  cityName: string | null;
  role: number;
  status: number;
  approvedMemberCount: number;
};

export type ApiOrganizationDetail = {
  id: string;
  name: string;
  description: string | null;
  cityId: string | null;
  cityName: string | null;
  founderUserId: string;
  myRole: number;
  myStatus: number;
  canManageMembers: boolean;
  canCreateEvents: boolean;
  canRotateInviteCode: boolean;
  canUpdateDetails: boolean;
  canLeave: boolean;
  inviteCode: string | null;
  approvedMemberCount: number;
  pendingMemberCount: number;
  blockedMemberCount: number;
};

export type ApiOrganizationMember = {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: number;
  status: number;
  createdAt: string;
  respondedAt: string | null;
};

export function organizationRoleLabel(role: number) {
  if (role === ORGANIZATION_ROLE.founder) {
    return i18n.t("organizations:role.founder");
  }
  if (role === ORGANIZATION_ROLE.admin) {
    return i18n.t("organizations:role.admin");
  }
  return i18n.t("organizations:role.member");
}

export function organizationStatusLabel(status: number) {
  if (status === ORGANIZATION_STATUS.pending) {
    return i18n.t("organizations:status.pending");
  }
  if (status === ORGANIZATION_STATUS.approved) {
    return i18n.t("organizations:status.approved");
  }
  if (status === ORGANIZATION_STATUS.rejected) {
    return i18n.t("organizations:status.rejected");
  }
  if (status === ORGANIZATION_STATUS.blocked) {
    return i18n.t("organizations:status.blocked");
  }
  return i18n.t("organizations:status.left");
}

export function canModerateOrganizationMember(
  myRole: number,
  myUserId: string | undefined,
  member: Pick<ApiOrganizationMember, "userId" | "role">,
) {
  if (!myUserId || member.userId === myUserId) {
    return false;
  }
  if (member.role === ORGANIZATION_ROLE.founder) {
    return false;
  }
  if (myRole === ORGANIZATION_ROLE.founder) {
    return true;
  }
  return (
    myRole === ORGANIZATION_ROLE.admin && member.role === ORGANIZATION_ROLE.member
  );
}
