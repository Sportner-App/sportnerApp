import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import {
  EmptyState,
  ErrorState,
  ScreenLoader,
  SegmentedTabs,
} from "@/components";
import { TabPage } from "@/features/app-shell/components/tab-page";
import { useDiscover } from "@/features/discover/hooks/use-discover";
import { useRequireAuth } from "@/features/auth/hooks/use-require-auth";

import { DiscoverModeTabs } from "@/features/discover/components/discover-mode-tabs";
import { DiscoverPost } from "@/features/discover/components/discover-post";
import { PeopleRail } from "@/features/discover/components/people-rail";
import { MyOrganizationsList } from "@/features/organizations/components/my-organizations-list";
import { OrganizationsExploreList } from "@/features/organizations/components/organizations-explore-list";
import { useExploreClubs } from "@/features/organizations/hooks/use-explore-clubs";
import { useMyOrganizations } from "@/features/organizations/hooks/use-organizations";

type DiscoverMode = "feed" | "clubs";
type ClubScope = "all" | "mine";

export function DiscoverScreen() {
  const router = useRouter();
  const {
    mode: modeParam,
    scope: scopeParam,
    ts: tsParam,
  } = useLocalSearchParams<{
    mode?: string;
    scope?: string;
    /** Her yönlendirmede değişir; aynı mode/scope ile tekrar gelişte de senkron tetiklensin. */
    ts?: string;
  }>();
  const { isAuthenticated, requireAuth } = useRequireAuth();
  const { t } = useTranslation([
    "discover",
    "common",
    "events",
    "organizations",
  ]);
  const {
    posts,
    people,
    friendIds,
    scope,
    setScope,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleLike,
    addComment,
    addReply,
  } = useDiscover();
  const [mode, setMode] = useState<DiscoverMode>(
    modeParam === "clubs" ? "clubs" : "feed",
  );
  const [clubScope, setClubScope] = useState<ClubScope>(
    scopeParam === "mine" ? "mine" : "all",
  );
  const explore = useExploreClubs();
  const mine = useMyOrganizations(
    isAuthenticated && mode === "clubs" && clubScope === "mine",
  );

  // Profilden / kulüpten ayrılınca tekrar gelindiğinde doğru sekme açılsın.
  useEffect(() => {
    if (modeParam === "clubs") {
      setMode("clubs");
      setClubScope(scopeParam === "mine" ? "mine" : "all");
    } else if (modeParam === "feed") {
      setMode("feed");
    }
  }, [modeParam, scopeParam, tsParam]);

  const isClubs = mode === "clubs";
  const isMine = isClubs && clubScope === "mine";
  const active = !isClubs ? null : isMine ? mine : explore;

  return (
    <TabPage
      edgeToEdge
      keyboardAvoiding
      refreshing={active ? active.isRefreshing : isRefreshing}
      onRefresh={
        !isClubs
          ? refresh
          : isMine && !isAuthenticated
            ? () => {}
            : (active as NonNullable<typeof active>).refresh
      }
      onEndReached={isClubs && !isMine ? explore.loadMore : undefined}
      headerAction={
        isClubs
          ? {
              icon: "plus",
              label: t("organizations:explore.createCta"),
              onPress: () =>
                requireAuth(t("organizations:explore.createAuthReason")) &&
                router.push("/clubs/create"),
            }
          : {
              icon: "plus",
              label: t("discover:hero.createA11y"),
              onPress: () =>
                requireAuth(t("discover:auth.createPost")) &&
                router.push("/posts/create"),
            }
      }
    >
      <DiscoverModeTabs
        options={[
          { key: "feed" as const, label: t("discover:mode.feed") },
          { key: "clubs" as const, label: t("discover:mode.clubs") },
        ]}
        value={mode}
        onChange={setMode}
      />

      {isClubs ? (
        <View className="gap-4 px-5">
          <SegmentedTabs
            options={[
              { key: "all", label: t("organizations:clubs.tabAll") },
              { key: "mine", label: t("organizations:clubs.tabMine") },
            ]}
            value={clubScope}
            onChange={setClubScope}
          />
          {isMine ? (
            <MyOrganizationsList state={mine} />
          ) : (
            <OrganizationsExploreList state={explore} />
          )}
        </View>
      ) : (
        <>
          <View className="px-5">
            <SegmentedTabs
              options={[
                { key: "all", label: t("discover:filter.all") },
                { key: "friends", label: t("discover:filter.friends") },
              ]}
              value={scope}
              onChange={(next) => {
                if (
                  next === "friends" &&
                  !requireAuth(t("discover:auth.friendsFilter"))
                ) {
                  return false;
                }
                setScope(next);
              }}
            />
          </View>

          {people.length > 0 ? (
            <PeopleRail
              // Arkadaş olunanlar öneride durmasın: zaten eklenmiş birine
              // "Ekle" göstermek listeyi gürültüye çeviriyordu.
              people={people.filter((person) => !friendIds.has(person.userId))}
              onOpenProfile={(userId: string) =>
                router.push(`/users/${userId}`)
              }
              onSeeAll={() => router.push("/people")}
            />
          ) : null}

          {isLoading ? (
            <ScreenLoader
              label={t("discover:loading")}
              className="items-center px-5 py-16"
              size={148}
            />
          ) : error ? (
            <ErrorState message={error} onRetry={refresh} className="mx-5" />
          ) : posts.length === 0 ? (
            <EmptyState
              icon="images"
              message={t("discover:empty.message")}
              className="mx-5"
              action={{
                label: t("discover:empty.cta"),
                variant: "primary",
                onPress: () => {
                  if (requireAuth(t("discover:auth.createPost"))) {
                    router.push("/posts/create");
                  }
                },
              }}
            />
          ) : (
            posts.map((post) => (
              <DiscoverPost
                key={post.id}
                post={post}
                onLike={async () => {
                  if (!requireAuth(t("discover:auth.like"))) return;
                  await toggleLike(post);
                }}
                onComment={(content) => {
                  if (!requireAuth(t("discover:auth.comment")))
                    return Promise.reject(new Error("AUTH_REQUIRED"));
                  return addComment(post, content);
                }}
                onReply={(parent, content) => {
                  if (!requireAuth(t("discover:auth.reply")))
                    return Promise.reject(new Error("AUTH_REQUIRED"));
                  return addReply(post, parent.id, content);
                }}
                onAuthorPress={() => router.push(`/users/${post.userId}`)}
                isFriend={friendIds.has(post.userId)}
              />
            ))
          )}
        </>
      )}
    </TabPage>
  );
}
