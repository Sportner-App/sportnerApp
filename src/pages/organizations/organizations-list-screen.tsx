import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import {
  AppScreen,
  brandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useMyOrganizations } from "@/hooks/use-organizations";
import {
  ORGANIZATION_STATUS,
  organizationRoleLabel,
  organizationStatusLabel,
} from "@/types/organizations";

export function OrganizationsListScreen() {
  const { t } = useTranslation("organizations");
  const router = useRouter();
  const { items, isLoading, isRefreshing, error, refresh } = useMyOrganizations();

  return (
    <AppScreen
      header={
        <ScreenHeader
          title={t("list.title")}
          showBack
          right={
            <Pressable
              hitSlop={8}
              onPress={() => router.push("/organizations/create")}
              className="h-10 w-10 items-center justify-center rounded-full border border-border-default bg-surface-primary"
            >
              <FontAwesome6 name="plus" size={14} color="#ccff00" />
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={brandRefreshControl({
        refreshing: isRefreshing,
        onRefresh: refresh,
      })}
    >
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label={t("list.create")}
            size="sm"
            onPress={() => router.push("/organizations/create")}
          />
        </View>
        <View className="flex-1">
          <Button
            label={t("list.joinWithCode")}
            variant="outline"
            size="sm"
            onPress={() => router.push("/organizations/join")}
          />
        </View>
      </View>

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} />
        </View>
      ) : error ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          {error}
        </Text>
      ) : items.length === 0 ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          {t("list.empty")}
        </Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/organizations/${item.id}`)}
            className="rounded-3xl border border-border-default bg-surface-primary p-4"
          >
            <Text className="font-body text-base font-semibold text-text-primary">
              {item.name}
            </Text>
            <Text className="mt-1 font-body text-xs text-text-tertiary">
              {[item.cityName, organizationRoleLabel(item.role)]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <Text
              className={`mt-2 font-body text-xs ${
                item.status === ORGANIZATION_STATUS.pending
                  ? "text-amber-300"
                  : "text-text-secondary"
              }`}
            >
              {item.status === ORGANIZATION_STATUS.pending
                ? organizationStatusLabel(item.status)
                : t("list.memberCount", { count: item.approvedMemberCount })}
            </Text>
          </Pressable>
        ))
      )}
    </AppScreen>
  );
}
