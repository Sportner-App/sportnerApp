import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export type InboxTab = "events" | "friends";

export function useConversationsTabCopy() {
  const { t } = useTranslation("messaging");

  return useMemo(
    () =>
      ({
        events: {
          subtitle: t("tabsCopy.events.subtitle"),
          emptyTitle: t("tabsCopy.events.emptyTitle"),
          emptyBody: t("tabsCopy.events.emptyBody"),
          icon: "calendar-days" as const,
        },
        friends: {
          subtitle: t("tabsCopy.friends.subtitle"),
          emptyTitle: t("tabsCopy.friends.emptyTitle"),
          emptyBody: t("tabsCopy.friends.emptyBody"),
          icon: "user-group" as const,
        },
      }) satisfies Record<
        InboxTab,
        {
          subtitle: string;
          emptyTitle: string;
          emptyBody: string;
          icon: "calendar-days" | "user-group";
        }
      >,
    [t],
  );
}
