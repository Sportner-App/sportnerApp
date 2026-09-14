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
    return `/events/${entityId}`;
  }
  if (entityType === NOTIFICATION_ENTITY.post) {
    return `/posts/${entityId}`;
  }
  if (entityType === NOTIFICATION_ENTITY.conversation) {
    return `/conversations/${entityId}`;
  }
  if (entityType === NOTIFICATION_ENTITY.badge) {
    return "/badges";
  }
  if (entityType === NOTIFICATION_ENTITY.organization) {
    return `/organizations/${entityId}`;
  }

  return "/notifications";
}
