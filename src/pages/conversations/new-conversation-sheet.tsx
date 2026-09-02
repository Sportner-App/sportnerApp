import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Avatar, BottomSheet, SportLoader } from "@/components";
import { themeColors } from "@/constants/theme";
import { useToast } from "@/contexts";
import { getApiErrorMessage } from "@/lib/api/errors";
import { createDirectConversation } from "@/services/messaging-service";
import { listFriends } from "@/services/social-service";
import type { ApiFriend } from "@/types/social";

type NewConversationSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function NewConversationSheet({
  visible,
  onClose,
}: NewConversationSheetProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [startingUserId, setStartingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void listFriends(1, 100)
      .then((page) => {
        if (!cancelled) {
          setFriends(page?.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFriends([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) {
      return friends;
    }
    return friends.filter((friend) =>
      [friend.username, friend.firstName]
        .filter(Boolean)
        .some((value) => normalizeSearch(value as string).includes(needle)),
    );
  }, [friends, query]);

  const startConversation = async (friend: ApiFriend) => {
    if (startingUserId) {
      return;
    }

    setStartingUserId(friend.userId);
    try {
      const conversation = await createDirectConversation(friend.userId);
      onClose();
      if (conversation) {
        router.push(`/conversations/${conversation.id}`);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Sohbet başlatılamadı",
        description: getApiErrorMessage(error),
      });
    } finally {
      setStartingUserId(null);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Yeni sohbet"
      subtitle="Sohbet başlatmak istediğin arkadaşını seç"
    >
      <View className="mb-3 flex-row items-center gap-3 rounded-2xl border border-border-default bg-surface-secondary px-4 py-3">
        <FontAwesome6
          name="magnifying-glass"
          size={14}
          color={themeColors.text.tertiary}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Arkadaş ara…"
          placeholderTextColor={themeColors.text.tertiary}
          autoCorrect={false}
          autoCapitalize="none"
          className="flex-1 font-body text-base text-text-primary"
        />
        {query.length > 0 ? (
          <Pressable
            hitSlop={8}
            onPress={() => setQuery("")}
            className="active:opacity-70"
          >
            <FontAwesome6
              name="xmark"
              size={14}
              color={themeColors.text.secondary}
            />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View className="items-center py-10">
          <SportLoader size={96} label="Arkadaşların yükleniyor" />
        </View>
      ) : filtered.length === 0 ? (
        <View className="items-center gap-2 px-4 py-10">
          <FontAwesome6
            name="user-group"
            size={20}
            color={themeColors.text.tertiary}
          />
          <Text className="text-center font-body text-sm text-text-secondary">
            {friends.length === 0
              ? "Henüz kabul edilmiş bir arkadaşın yok."
              : "Eşleşen arkadaş bulunamadı."}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ maxHeight: 380 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View className="gap-1 pb-2">
            {filtered.map((friend) => (
              <Pressable
                key={friend.userId}
                disabled={startingUserId !== null}
                onPress={() => void startConversation(friend)}
                className="flex-row items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-surface-secondary disabled:opacity-60"
              >
                <Avatar
                  uri={friend.profileImageUrl}
                  name={friend.username || friend.firstName}
                  size={46}
                  borderWidth={0}
                />
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-bold text-sm text-text-primary"
                  >
                    @{friend.username || "sporcu"}
                  </Text>
                  {friend.firstName ? (
                    <Text
                      numberOfLines={1}
                      className="mt-0.5 font-body text-xs text-text-tertiary"
                    >
                      {friend.firstName}
                    </Text>
                  ) : null}
                </View>
                {startingUserId === friend.userId ? (
                  <SportLoader size={28} label="" />
                ) : (
                  <FontAwesome6
                    name="paper-plane"
                    size={14}
                    color={themeColors.brand.primary}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </BottomSheet>
  );
}
