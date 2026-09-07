import i18n from "@/i18n";

export type ApiNotification = {
  id: string;
  notificationType: number;
  entityType: number;
  entityId: string | null;
  actorUserId: string | null;
  actorUsername: string | null;
  title: string;
  body: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type ApiNotificationSetting = {
  notificationType: number;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
};

export const NOTIFICATION_ENTITY = {
  user: 0,
  event: 1,
  post: 2,
  comment: 3,
  conversation: 4,
  badge: 5,
  quest: 6,
  organization: 7,
} as const;

export const NOTIFICATION_TYPE = {
  friendRequest: 0,
  friendAccepted: 1,
  eventInvitation: 2,
  eventRequestApproved: 3,
  eventRequestRejected: 4,
  eventReminder: 5,
  eventCancelled: 6,
  postLiked: 7,
  postCommented: 8,
  commentReplied: 9,
  badgeEarned: 10,
  newMessage: 11,
  system: 12,
  questCompleted: 13,
  eventQuestionAsked: 14,
  eventQuestionReplied: 15,
  organizationJoinRequested: 16,
  organizationJoinApproved: 17,
  organizationJoinRejected: 18,
  organizationRoleChanged: 19,
  organizationMemberRemoved: 20,
  organizationMemberBlocked: 21,
} as const;

const NAMED_ACTION_TYPES = new Set<number>([
  NOTIFICATION_TYPE.friendRequest,
  NOTIFICATION_TYPE.friendAccepted,
  NOTIFICATION_TYPE.eventInvitation,
  NOTIFICATION_TYPE.eventRequestApproved,
  NOTIFICATION_TYPE.eventRequestRejected,
  NOTIFICATION_TYPE.eventCancelled,
  NOTIFICATION_TYPE.postLiked,
  NOTIFICATION_TYPE.postCommented,
  NOTIFICATION_TYPE.commentReplied,
  NOTIFICATION_TYPE.newMessage,
  NOTIFICATION_TYPE.eventQuestionAsked,
  NOTIFICATION_TYPE.eventQuestionReplied,
  NOTIFICATION_TYPE.organizationJoinRequested,
  NOTIFICATION_TYPE.organizationJoinApproved,
  NOTIFICATION_TYPE.organizationJoinRejected,
  NOTIFICATION_TYPE.organizationRoleChanged,
  NOTIFICATION_TYPE.organizationMemberRemoved,
  NOTIFICATION_TYPE.organizationMemberBlocked,
]);

function namedAction(type: number): string | undefined {
  if (!NAMED_ACTION_TYPES.has(type)) {
    return undefined;
  }
  const key = `notifications:actions.${type}`;
  const action = i18n.t(key);
  return action === key ? undefined : action;
}

export function notificationCopy(item: ApiNotification) {
  const actor = item.actorUsername?.trim();
  if (actor && item.title.includes(actor)) {
    return { title: item.title, body: item.body };
  }

  const action = namedAction(item.notificationType);
  if (!action) {
    return { title: item.title, body: item.body };
  }

  const title = actor
    ? i18n.t("notifications:copy.namedUser", { username: actor, action })
    : i18n.t("notifications:copy.anonymousUser", { action });
  return { title, body: item.body };
}

export function notificationSettingLabel(type: number): string {
  const key = `notifications:settingsLabels.${type}`;
  const label = i18n.t(key);
  if (label !== key) {
    return label;
  }
  return i18n.t("notifications:settings.typeFallback", { type });
}
