import { NOTIFICATION_ENTITY, NOTIFICATION_TYPE } from "@/types/notifications";

type NotificationRouteData = {
  notificationType?: number | string;
  entityType?: number | string;
  entityId?: string | null;
};

/** Shared by the push tap-response handler and the in-app notification banner. */
export function resolveNotificationRoute(data: NotificationRouteData): string {
  const entityType = Number(data.entityType);
  const notificationType = Number(data.notificationType);
  const entityId = typeof data.entityId === "string" ? data.entityId : null;

  if (!entityId) {
    return "/notifications";
  }

  if (
    notificationType === NOTIFICATION_TYPE.friendRequest ||
    notificationType === NOTIFICATION_TYPE.friendAccepted ||
    entityType === NOTIFICATION_ENTITY.user
  ) {
    return `/users/${entityId}`;
  }

  if (
    notificationType === NOTIFICATION_TYPE.eventReviewPrompt &&
    entityType === NOTIFICATION_ENTITY.event
  ) {
    return `/events/${entityId}/reviews`;
  }

  if (entityType === NOTIFICATION_ENTITY.event) {
    // These land on the event detail screen's Q&A section instead of its top, so the user
    // doesn't have to scroll down themselves to find the question the notification was about.
    if (
      notificationType === NOTIFICATION_TYPE.eventQuestionAsked ||
      notificationType === NOTIFICATION_TYPE.eventQuestionReplied
    ) {
      return `/events/${entityId}?focus=questions`;
    }
    return `/events/${entityId}`;
  }
  if (entityType === NOTIFICATION_ENTITY.post) {
    // Same idea for the post's comments section.
    if (
      notificationType === NOTIFICATION_TYPE.postCommented ||
      notificationType === NOTIFICATION_TYPE.commentReplied
    ) {
      return `/posts/${entityId}?focus=comments`;
    }
    return `/posts/${entityId}`;
  }
  if (entityType === NOTIFICATION_ENTITY.conversation) {
    return `/conversations/${entityId}`;
  }
  if (
    entityType === NOTIFICATION_ENTITY.badge ||
    entityType === NOTIFICATION_ENTITY.quest
  ) {
    // Quests are shown inline on the same badges screen - there's no dedicated quest route.
    return "/badges";
  }
  if (entityType === NOTIFICATION_ENTITY.organization) {
    return `/organizations/${entityId}`;
  }

  return "/notifications";
}
