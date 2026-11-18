import { useRouter } from "expo-router";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { Button, EmptyState, ScreenLoader } from "@/components";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";
import { ClubGridCard } from "@/features/organizations/components/club-grid-card";
import type { useMyOrganizations } from "@/features/organizations/hooks/use-organizations";
import {
  ORGANIZATION_STATUS,
  organizationRoleLabel,
  organizationStatusLabel,
} from "@/features/organizations/types";

/** "Kulüplerim" sekmesi: oluştur / kodla katıl + üyelik kartları. */
export function MyOrganizationsList({
  state,
}: {
  state: ReturnType<typeof useMyOrganizations>;
}) {
  const { t } = useTranslation(["organizations", "auth"]);
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const { items, isLoading, error } = state;

  if (!isAuthenticated) {
    return (
      <EmptyState
        icon="people-group"
        message={t("organizations:clubs.signInToSeeMine")}
        action={{
          label: t("auth:modes.login"),
          variant: "primary",
          onPress: () => requireAuth(t("organizations:clubs.signInToSeeMine")),
        }}
      />
    );
  }

  return (
    <>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label={t("list.create")}
            size="sm"
            onPress={() => router.push("/clubs/create")}
          />
        </View>
        <View className="flex-1">
          <Button
            label={t("list.joinWithCode")}
            variant="outline"
            size="sm"
            onPress={() => router.push("/clubs/join")}
          />
        </View>
      </View>

      {isLoading ? (
        <ScreenLoader />
      ) : error ? (
        <EmptyState variant="inline" message={error} />
      ) : items.length === 0 ? (
        <EmptyState variant="inline" message={t("list.empty")} />
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {items.map((item) => (
            <ClubGridCard
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.imageUrl}
              subtitle={[item.cityName, organizationRoleLabel(item.role)]
                .filter(Boolean)
                .join(" · ")}
              badge={
                item.status === ORGANIZATION_STATUS.pending
                  ? {
                      kind: "pending",
                      label: organizationStatusLabel(item.status),
                    }
                  : !item.isPublic
                    ? { kind: "private", label: t("visibility.private") }
                    : undefined
              }
            />
          ))}
        </View>
      )}
    </>
  );
}
