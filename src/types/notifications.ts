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
} as const;

export const NOTIFICATION_TYPE = {
  friendRequest: 0,
  friendAccepted: 1,
  postLiked: 7,
} as const;

export function notificationCopy(item: ApiNotification) {
  if (item.notificationType === NOTIFICATION_TYPE.postLiked) {
    const who = item.actorUsername?.trim();
    const title = who
      ? `${who} kullanıcısı fotoğrafını beğendi`
      : "Bir kullanıcı fotoğrafını beğendi";
    return { title, body: title };
  }

  return { title: item.title, body: item.body };
}

export const NOTIFICATION_SETTING_LABELS: Record<number, string> = {
  0: "Arkadaşlık isteği",
  1: "Arkadaşlık kabul",
  2: "Etkinlik daveti",
  3: "Katılım onaylandı",
  4: "Katılım reddedildi",
  5: "Etkinlik hatırlatması",
  6: "Etkinlik iptali",
  7: "Gönderi beğenisi",
  8: "Gönderi yorumu",
  9: "Yorum yanıtı",
  10: "Rozet kazandın",
  11: "Yeni mesaj",
  12: "Sistem",
  13: "Görev tamamlandı",
};
