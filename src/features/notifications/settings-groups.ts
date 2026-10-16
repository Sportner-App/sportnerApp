import type { IconName } from "@/types/components";
import { NOTIFICATION_TYPE } from "@/features/notifications/types";

/**
 * Bildirim türleri kullanıcıya tek tek değil, grup halinde sunulur.
 *
 * Sunucuda 36 tür var ve her birine ayrı anahtar koymak ayarları okunamaz hale
 * getiriyordu. Kullanıcı "etkinliklerle ilgili bildirim istiyor muyum" diye
 * düşünüyor, "davet kabul edildi ile davet reddedildi'yi ayrı ayrı" diye değil.
 *
 * Buradaki listeler türlerin tamamını kapsamak zorunda: kapsanmayan bir tür
 * ekranda hiç görünmez ve kullanıcı onu asla kapatamaz. Dosyanın sonundaki
 * AssertEveryTypeIsCovered bunu derleme zamanında zorunlu kılıyor.
 */
export type NotificationGroupKey =
  | "events"
  | "social"
  | "posts"
  | "messages"
  | "organizations"
  | "achievements";

export type NotificationGroup = {
  key: NotificationGroupKey;
  icon: IconName;
  types: readonly number[];
};

const T = NOTIFICATION_TYPE;

export const NOTIFICATION_GROUPS = [
  {
    key: "events",
    icon: "calendar-check",
    types: [
      T.eventInvitation,
      T.eventRequestApproved,
      T.eventRequestRejected,
      T.eventReminder,
      T.eventCancelled,
      T.eventQuestionAsked,
      T.eventQuestionReplied,
      T.eventReviewPrompt,
      T.eventInvitationAccepted,
      T.eventInvitationDeclined,
      T.eventParticipationCancelled,
      T.eventParticipantRemoved,
      T.eventScheduleUpdated,
      T.eventLocationUpdated,
      T.eventFeeUpdated,
      T.eventCapacityUpdated,
      T.eventUpdated,
      T.eventAttendancePending,
    ],
  },
  {
    key: "social",
    icon: "user-group",
    types: [T.friendRequest, T.friendAccepted, T.reviewReceived],
  },
  {
    key: "posts",
    icon: "heart",
    types: [T.postLiked, T.postCommented, T.commentReplied],
  },
  {
    key: "messages",
    icon: "comment",
    types: [T.newMessage, T.conversationMemberAdded],
  },
  {
    key: "organizations",
    icon: "shield-halved",
    types: [
      T.organizationJoinRequested,
      T.organizationJoinApproved,
      T.organizationJoinRejected,
      T.organizationRoleChanged,
      T.organizationMemberRemoved,
      T.organizationMemberBlocked,
      T.organizationMemberJoined,
    ],
  },
  {
    key: "achievements",
    icon: "trophy",
    types: [T.badgeEarned, T.questCompleted],
  },
] as const satisfies readonly NotificationGroup[];

/**
 * Hiçbir gruba girmeyen türler. `system` bilerek dışarıda: hesapla ilgili
 * zorunlu duyurular için ayrılmış, kullanıcı kapatamamalı.
 */
export const UNGROUPED_TYPES = [T.system] as const;

export const ALL_GROUPED_TYPES: number[] = NOTIFICATION_GROUPS.flatMap(
  (group) => [...group.types],
);

/**
 * Her bildirim türü ya bir gruba ya da UNGROUPED_TYPES'a girmek zorunda.
 * Kapsanmayan bir tür ayarlar ekranında hiç görünmez, yani kullanıcı onu asla
 * kapatamaz — ve bu sessizce olur. Aşağıdaki atama bunu derleme zamanında
 * yakalar: yeni bir tür eklenip hiçbir listeye konmazsa tsc burada durur.
 */
type CoveredType =
  | (typeof NOTIFICATION_GROUPS)[number]["types"][number]
  | (typeof UNGROUPED_TYPES)[number];

type EveryNotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** Yalnızca `true` kabul eder; `false` geldiğinde tsc burada hata verir. */
type AssertTrue<T extends true> = T;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AssertEveryTypeIsCovered = AssertTrue<
  [Exclude<EveryNotificationType, CoveredType>] extends [never] ? true : false
>;
