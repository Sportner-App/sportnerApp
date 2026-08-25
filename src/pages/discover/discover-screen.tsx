import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import {
  AppScreen,
  BrandRefreshControl,
  Button,
  LinearRefreshBar,
  ScreenHeader,
  SportLoader,
} from "@/components";
import { useDiscover } from "@/hooks/use-discover";

import { DiscoverPost } from "./discover-post";

export function DiscoverScreen() {
  const router = useRouter();
  const {
    posts,
    isLoading,
    isRefreshing,
    error,
    refresh,
    toggleLike,
    addComment,
  } = useDiscover();

  return (
    <AppScreen
      withTabBar
      keyboardAvoiding
      header={
        <ScreenHeader
          title="KEŞFET"
          right={
            <Pressable
              hitSlop={8}
              onPress={() => router.push("/posts/create")}
              accessibilityRole="button"
              accessibilityLabel="Fotoğraf paylaş"
              className="h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-brand-surface/90 active:opacity-80"
            >
              <FontAwesome6 name="plus" size={14} color="#ccff00" />
            </Pressable>
          }
        />
      }
      belowHeader={<LinearRefreshBar visible={isRefreshing} />}
      contentClassName="pt-1"
      refreshControl={
        <BrandRefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      {isLoading ? (
        <View className="items-center px-6 py-16">
          <SportLoader size={148} label="Keşfet yükleniyor" />
        </View>
      ) : error ? (
        <View className="mx-6 items-center gap-3 rounded-3xl border border-white/10 px-6 py-12">
          <Text className="text-center font-body text-sm text-brand-neutral">
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
        <View className="mx-6 items-center gap-3 rounded-3xl border border-white/10 bg-brand-surface/60 px-6 py-12">
          <FontAwesome6 name="images" size={22} color="#64748b" />
          <Text className="text-center font-body text-sm text-brand-neutral">
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
            onAuthorPress={() => router.push(`/users/${post.userId}`)}
          />
        ))
      )}
    </AppScreen>
  );
}
