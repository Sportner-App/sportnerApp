import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { Avatar, Button, SportLoader, TabPage } from "@/components";
import { themeColors } from "@/constants/theme";
import { useDiscover } from "@/hooks/use-discover";

import { DiscoverPost } from "./discover-post";

export function DiscoverScreen() {
  const router = useRouter();
  const {
    posts,
    people,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleLike,
    addComment,
    addReply,
  } = useDiscover();

  return (
    <TabPage keyboardAvoiding refreshing={isRefreshing} onRefresh={refresh}>
      <DiscoverHero
        postCount={posts.length}
        onCreate={() => router.push("/posts/create")}
      />

      {people.length > 0 ? (
        <View>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-body-bold text-sm text-text-primary">
              Yeni sporcular keşfet
            </Text>
            <Pressable
              hitSlop={8}
              onPress={() => router.push("/people")}
              className="flex-row items-center gap-1.5 rounded-full border border-border-default bg-surface-primary px-3 py-1.5 active:opacity-75"
            >
              <Text className="font-body-bold text-[11px] text-brand-primary">
                Tümünü gör
              </Text>
              <FontAwesome6
                name="chevron-right"
                size={9}
                color={themeColors.brand.primary}
              />
            </Pressable>
          </View>
          <View className="flex-row">
            {people.slice(0, 4).map((person) => {
              return (
                <Pressable
                  key={person.userId}
                  onPress={() => router.push(`/users/${person.userId}`)}
                  className="flex-1 items-center px-1 active:opacity-75"
                >
                  <Avatar
                    uri={person.avatarUrl}
                    name={person.name}
                    size={58}
                    borderWidth={2}
                  />
                  <Text
                    numberOfLines={1}
                    className="mt-1.5 w-full text-center font-body text-[11px] text-text-secondary"
                  >
                    @{person.username || "sporcu"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {!isLoading && !error && posts.length > 0 ? (
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-display text-[22px] text-text-primary">
              Anı yakala
            </Text>
            <Text className="mt-1 font-body text-xs text-text-secondary">
              Topluluktan son paylaşımlar
            </Text>
          </View>
          <View className="rounded-full border border-border-default bg-surface-primary px-3 py-1.5">
            <Text className="font-mono text-[10px] text-brand-primary">
              {posts.length} GÖNDERİ
            </Text>
          </View>
        </View>
      ) : null}

      {isLoading ? (
        <View className="items-center py-16">
          <SportLoader size={148} label="Keşfet yükleniyor" />
        </View>
      ) : error ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <Text className="text-center font-body text-sm text-text-secondary">
            {error}
          </Text>
          <Button
            label="Tekrar Dene"
            variant="outline"
            size="sm"
            onPress={refresh}
          />
        </View>
      ) : posts.length === 0 ? (
        <View className="items-center gap-3 rounded-3xl border border-border-default bg-surface-primary px-6 py-12">
          <FontAwesome6
            name="images"
            size={22}
            color={themeColors.text.tertiary}
          />
          <Text className="text-center font-body text-sm text-text-secondary">
            Henüz paylaşım yok. İlk fotoğrafı sen ekle.
          </Text>
          <Button
            label="Fotoğraf paylaş"
            size="sm"
            onPress={() => router.push("/posts/create")}
          />
        </View>
      ) : (
        posts.map((post) => (
          <DiscoverPost
            key={post.id}
            post={post}
            onLike={() => toggleLike(post)}
            onComment={(content) => addComment(post, content)}
            onReply={(parent, content) => addReply(post, parent.id, content)}
            onAuthorPress={() => router.push(`/users/${post.userId}`)}
          />
        ))
      )}
    </TabPage>
  );
}

function DiscoverHero({
  postCount,
  onCreate,
}: {
  postCount: number;
  onCreate: () => void;
}) {
  return (
    <View className="overflow-hidden rounded-[24px] border border-border-default bg-surface-primary p-4">
      <View className="absolute -right-9 -top-10 h-28 w-28 rounded-full border-[18px] border-brand-primary/10" />
      <View className="flex-row items-center gap-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <View className="h-2 w-2 rounded-full bg-brand-primary" />
            <Text className="font-mono-bold text-[8px] tracking-[1.8px] text-brand-primary">
              COMMUNITY
            </Text>
            <Text className="font-mono text-[8px] text-text-tertiary">
              · {postCount} paylaşım
            </Text>
          </View>
          <Text className="mt-2 font-display text-[24px] leading-7 text-text-primary">
            Hareketi <Text className="text-brand-primary">paylaş.</Text>
          </Text>
          <Text className="mt-1.5 font-body text-xs text-text-secondary">
            Spor anını toplulukla buluştur.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Gönderi paylaş"
          onPress={onCreate}
          className="min-h-14 min-w-[116px] flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary px-3 active:opacity-85"
        >
          <FontAwesome6
            name="camera"
            size={17}
            color={themeColors.background.primary}
          />
          <Text className="font-body-bold text-[11px] text-background-primary">
            Gönderi paylaş
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
