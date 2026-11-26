import { useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState, ScreenLoader } from "@/components";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import type { ExploreClubsState } from "@/features/organizations/hooks/use-explore-clubs";

/** "Tüm kulüpler" listesi boşken: yükleniyor / hata / boş durum. */
export function ClubExploreEmpty({ state }: { state: ExploreClubsState }) {
  const { t } = useTranslation("organizations");
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const { items, isLoading, reload, error, isSearching } = state;

  if (isLoading && items.length === 0) {
    return (
      <View className="px-5">
        <ScreenLoader />
      </View>
    );
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        message={error}
        onRetry={() => void reload()}
        className="mx-5"
      />
    );
  }

  return (
    <EmptyState
      icon="people-group"
      message={isSearching ? t("explore.emptySearch") : t("explore.empty")}
      className="mx-5"
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
  );
}
