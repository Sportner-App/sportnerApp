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
} as const;

const NAMED_ACTIONS: Partial<Record<number, string>> = {
  [NOTIFICATION_TYPE.friendRequest]: "arkadaşlık isteği gönderdi",
  [NOTIFICATION_TYPE.friendAccepted]: "arkadaşlık isteğini kabul etti",
  [NOTIFICATION_TYPE.eventInvitation]: "seni etkinliğe davet etti",
  [NOTIFICATION_TYPE.eventRequestApproved]: "başvurunu onayladı",
  [NOTIFICATION_TYPE.eventRequestRejected]: "başvurunu reddetti",
  [NOTIFICATION_TYPE.eventCancelled]: "etkinliği iptal etti",
  [NOTIFICATION_TYPE.postLiked]: "fotoğrafını beğendi",
  [NOTIFICATION_TYPE.postCommented]: "fotoğrafına yorum yaptı",
  [NOTIFICATION_TYPE.commentReplied]: "yorumuna yanıt verdi",
  [NOTIFICATION_TYPE.newMessage]: "mesaj gönderdi",
  [NOTIFICATION_TYPE.eventQuestionAsked]: "etkinliğine soru sordu",
  [NOTIFICATION_TYPE.eventQuestionReplied]: "soruna yanıt verdi",
};

export function notificationCopy(item: ApiNotification) {
  if (item.title.includes("kullanıcısı")) {
    return { title: item.title, body: item.body };
  }

  const action = NAMED_ACTIONS[item.notificationType];
  if (!action) {
    return { title: item.title, body: item.body };
  }

  const who = item.actorUsername?.trim();
  const title = who
    ? `${who} kullanıcısı ${action}`
    : `Bir kullanıcı ${action}`;
  return { title, body: item.body };
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
  14: "Etkinlik sorusu",
  15: "Soru yanıtı",
};
