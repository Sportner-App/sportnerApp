import { useFocusEffect } from "@react-navigation/native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  LinearRefreshBar,
  ScreenHeader,
  SegmentedTabs,
  SportLoader,
} from "@/components";
import { themeColors } from "@/constants/theme";
import { useSession, useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  approveOrganizationMember,
  blockOrganizationMember,
  getOrganization,
  listBlockedOrganizationMembers,
  listOrganizationMembers,
  rejectOrganizationMember,
  removeOrganizationMember,
  unblockOrganizationMember,
  updateOrganizationMemberRole,
} from "@/services/organizations-service";
import {
  ORGANIZATION_ROLE,
  ORGANIZATION_STATUS,
  type ApiOrganizationDetail,
  type ApiOrganizationMember,
} from "@/types/organizations";
import { resolveRouteParam } from "@/utils/route-params";

import {
  OrganizationMemberRow,
  memberMatchesSearch,
} from "./organization-member-row";

type MembersTab = "members" | "pending" | "blocked";

function resolveMembersTab(value: string | string[] | undefined): MembersTab {
  const raw = resolveRouteParam(value);
  if (raw === "pending" || raw === "blocked") return raw;
  return "members";
}

export function OrganizationMembersScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { showToast } = useToast();
  const { id: rawId, tab: tabParam } = useLocalSearchParams<{
    id: string;
    tab?: string;
  }>();
  const organizationId = useMemo(() => resolveRouteParam(rawId), [rawId]);
  const initialTab = useMemo(() => resolveMembersTab(tabParam), [tabParam]);

  const [organization, setOrganization] = useState<ApiOrganizationDetail | null>(
    null,
  );
  const [members, setMembers] = useState<ApiOrganizationMember[]>([]);
  const [blockedMembers, setBlockedMembers] = useState<ApiOrganizationMember[]>(
    [],
  );
  const [tab, setTab] = useState<MembersTab>(initialTab);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const load = useCallback(
    async (mode: "initial" | "refresh") => {
      if (!organizationId) return;
      if (mode === "initial") setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const detail = await getOrganization(organizationId);
        setOrganization(detail);

        const [memberItems, blockedItems] = await Promise.all([
          listOrganizationMembers(organizationId),
          detail.canManageMembers
            ? listBlockedOrganizationMembers(organizationId)
            : Promise.resolve([]),
        ]);

        setMembers(memberItems);
        setBlockedMembers(blockedItems);
      } catch (error) {
        showToast({
          type: "error",
          title: "Yüklenemedi",
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [organizationId, showToast],
  );

  useFocusEffect(
    useCallback(() => {
      void load("initial");
    }, [load]),
  );

  const runMemberAction = async (
    userId: string,
    action: () => Promise<void>,
  ) => {
    setBusyUserId(userId);
    try {
      await action();
      await load("refresh");
    } catch (error) {
      showToast({
        type: "error",
        title: "İşlem yapılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setBusyUserId(null);
    }
  };

  const approvedMembers = useMemo(
    () =>
      members.filter((member) => member.status === ORGANIZATION_STATUS.approved),
    [members],
  );
  const pendingMembers = useMemo(
    () =>
      members.filter((member) => member.status === ORGANIZATION_STATUS.pending),
    [members],
  );

  const tabOptions = useMemo((): Array<{ key: MembersTab; label: string }> => {
    const options: Array<{ key: MembersTab; label: string }> = [
      { key: "members", label: `Üyeler (${approvedMembers.length})` },
    ];

    if (organization?.canManageMembers) {
      options.push(
        { key: "pending", label: `Onay (${pendingMembers.length})` },
        { key: "blocked", label: `Engelli (${blockedMembers.length})` },
      );
    }

    return options;
  }, [
    approvedMembers.length,
    blockedMembers.length,
    organization?.canManageMembers,
    pendingMembers.length,
  ]);

  const visibleMembers = useMemo(() => {
    const source =
      tab === "pending"
        ? pendingMembers
        : tab === "blocked"
          ? blockedMembers
          : approvedMembers;

    return source.filter((member) => memberMatchesSearch(member, query));
  }, [approvedMembers, blockedMembers, pendingMembers, query, tab]);

  if (!organizationId) {
    return (
      <AppScreen header={<ScreenHeader title="ÜYELER" showBack />}>
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          Organizasyon bulunamadı.
        </Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      header={<ScreenHeader title="ÜYELER" showBack />}
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="gap-4 px-6 pt-3"
      refreshControl={
        <BrandRefreshControl
          refreshing={isRefreshing}
          onRefresh={() => load("refresh")}
        />
      }
    >
      {organization ? (
        <Text className="font-body text-sm text-text-secondary">
          {organization.name}
        </Text>
      ) : null}

      {tabOptions.length > 1 ? (
        <SegmentedTabs options={tabOptions} value={tab} onChange={setTab} />
      ) : null}

      <View className="flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3">
        <FontAwesome6
          name="magnifying-glass"
          size={14}
          color={themeColors.text.tertiary}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="İsim veya kullanıcı adı ara"
          placeholderTextColor={themeColors.text.tertiary}
          autoCorrect={false}
          autoCapitalize="none"
          className="flex-1 font-body text-base text-text-primary"
        />
        {query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery("")}>
            <FontAwesome6
              name="xmark"
              size={14}
              color={themeColors.text.secondary}
            />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={120} label="Yükleniyor" />
        </View>
      ) : !organization ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          Organizasyon bulunamadı.
        </Text>
      ) : visibleMembers.length === 0 ? (
        <Text className="py-8 text-center font-body text-sm text-brand-neutral">
          {query.trim()
            ? "Aramana uygun üye yok."
            : tab === "pending"
              ? "Onay bekleyen kimse yok."
              : tab === "blocked"
                ? "Engellenen kimse yok."
                : "Henüz üye yok."}
        </Text>
      ) : (
        visibleMembers.map((member) => (
          <OrganizationMemberRow
            key={member.userId}
            member={member}
            organization={organization}
            currentUserId={user?.id}
            busyUserId={busyUserId}
            onPressProfile={() => router.push(`/users/${member.userId}`)}
            onApprove={() =>
              void runMemberAction(member.userId, async () => {
                await approveOrganizationMember(organization.id, member.userId);
              })
            }
            onReject={() =>
              void runMemberAction(member.userId, async () => {
                await rejectOrganizationMember(organization.id, member.userId);
              })
            }
            onToggleAdmin={() =>
              void runMemberAction(member.userId, async () => {
                await updateOrganizationMemberRole(
                  organization.id,
                  member.userId,
                  member.role === ORGANIZATION_ROLE.admin
                    ? ORGANIZATION_ROLE.member
                    : ORGANIZATION_ROLE.admin,
                );
              })
            }
            onRemove={() =>
              void runMemberAction(member.userId, async () => {
                await removeOrganizationMember(organization.id, member.userId);
              })
            }
            onBlock={() =>
              void runMemberAction(member.userId, async () => {
                await blockOrganizationMember(organization.id, member.userId);
              })
            }
            onUnblock={() =>
              void runMemberAction(member.userId, async () => {
                await unblockOrganizationMember(organization.id, member.userId);
              })
            }
          />
        ))
      )}
    </AppScreen>
  );
}
