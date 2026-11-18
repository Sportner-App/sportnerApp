import { useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, Input, ScreenLoader } from "@/components";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { ClubGridCard } from "@/features/organizations/components/club-grid-card";
import type { ExploreClubsState } from "@/features/organizations/hooks/use-explore-clubs";
import {
  ORGANIZATION_STATUS,
  organizationStatusLabel,
} from "@/features/organizations/types";

/** "Tüm kulüpler" sekmesi: arama + herkese açık kulüp listesi. */
export function OrganizationsExploreList({
  state,
}: {
  state: ExploreClubsState;
}) {
  const { t } = useTranslation("organizations");
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const {
    items,
    isLoading,
    isLoadingMore,
    reload,
    query,
    setQuery,
    error,
    isSearching,
  } = state;
  const initialLoading = isLoading && items.length === 0;

  return (
    <>
      <Input
        icon="magnifying-glass"
        size="sm"
        value={query}
        onChangeText={setQuery}
        placeholder={t("explore.searchPlaceholder")}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />

      {initialLoading ? (
        <ScreenLoader />
      ) : error && items.length === 0 ? (
        <ErrorState message={error} onRetry={() => void reload()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="people-group"
          message={isSearching ? t("explore.emptySearch") : t("explore.empty")}
          action={
            isSearching
              ? undefined
              : {
                  label: t("explore.createCta"),
                  variant: "primary",
                  onPress: () => {
                    if (requireAuth(t("explore.createAuthReason"))) {
                      router.push("/clubs/create");
                    }
                  },
                }
          }
        />
      ) : (
        <>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {items.map((club) => (
              <ClubGridCard
                key={club.id}
                id={club.id}
                name={club.name}
                imageUrl={club.imageUrl}
                subtitle={[
                  club.cityName,
                  t("explore.memberCount", {
                    count: club.approvedMemberCount,
                  }),
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
          {isLoadingMore ? <ScreenLoader variant="more" /> : null}
        </>
      )}
    </>
  );
}
