import { memo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { ClubGridCard } from "@/features/organizations/components/club-grid-card";
import {
  ORGANIZATION_STATUS,
  organizationStatusLabel,
  type ApiOrganizationSummary,
} from "@/features/organizations/types";

/** "Tüm kulüpler" listesinin satırı: yan yana en fazla iki kulüp kartı. */
function ClubExploreRowComponent({
  clubs,
}: {
  clubs: ApiOrganizationSummary[];
}) {
  const { t } = useTranslation("organizations");

  return (
    <View className="flex-row justify-between px-5">
      {clubs.map((club) => (
        <ClubGridCard
          key={club.id}
          id={club.id}
          name={club.name}
          imageUrl={club.imageUrl}
          subtitle={[
            club.cityName,
            t("explore.memberCount", { count: club.approvedMemberCount }),
          ]
            .filter(Boolean)
            .join(" · ")}
          badge={
            club.myStatus === ORGANIZATION_STATUS.approved
              ? { kind: "member", label: t("explore.memberBadge") }
              : club.myStatus === ORGANIZATION_STATUS.pending
                ? {
                    kind: "pending",
                    label: organizationStatusLabel(club.myStatus),
                  }
                : !club.isPublic
                  ? { kind: "private", label: t("visibility.private") }
                  : undefined
          }
        />
      ))}
    </View>
  );
}

export const ClubExploreRow = memo(ClubExploreRowComponent);
