import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { Avatar } from "@/components";
import { themeColors } from "@/constants/theme";
import type { ApiFriend } from "@/types/social";

type GuestDraft = { localId: string; firstName: string; lastName: string };

type Props = {
  maxParticipants: number;
  remainingSlots: number;
  guests: GuestDraft[];
  friends: ApiFriend[];
  selectedFriendIds: string[];
  isFriendsLoading: boolean;
  onAddGuest: () => void;
  onUpdateGuest: (
    localId: string,
    key: "firstName" | "lastName",
    value: string,
  ) => void;
  onRemoveGuest: (localId: string) => void;
  onToggleFriend: (userId: string) => void;
};

export function EventCompanionsStep({
  maxParticipants,
  remainingSlots,
  guests,
  friends,
  selectedFriendIds,
  isFriendsLoading,
  onAddGuest,
  onUpdateGuest,
  onRemoveGuest,
  onToggleFriend,
}: Props) {
  const reserved = guests.length + selectedFriendIds.length;

  return (
    <View className="mt-7 gap-5">
      <View className="rounded-[24px] border border-brand-primary/30 bg-brand-primary/10 p-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-body-bold text-sm text-text-primary">
              {remainingSlots} kişilik yer açık
            </Text>
            <Text className="mt-1 font-body text-xs text-text-secondary">
              1 organizatör + {reserved} yanında gelen
            </Text>
          </View>
          <Text className="font-mono-bold text-lg text-brand-primary">
            {1 + reserved}/{maxParticipants}
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-body-bold text-sm text-text-primary">
              Anonim misafirler
            </Text>
            <Text className="mt-0.5 font-body text-xs text-text-tertiary">
              Hesabı olmayan kişiler; isim girmek zorunlu değil.
            </Text>
          </View>
          <Pressable
            disabled={remainingSlots <= 0}
            onPress={onAddGuest}
            className="h-10 w-10 items-center justify-center rounded-full bg-brand-primary disabled:opacity-35"
          >
            <FontAwesome6
              name="plus"
              size={14}
              color={themeColors.text.onPrimary}
            />
          </Pressable>
        </View>

        {guests.map((guest, index) => (
          <View
            key={guest.localId}
            className="gap-3 rounded-[22px] border border-border-default bg-surface-primary p-3.5"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-surface-secondary">
                  <FontAwesome6
                    name="user"
                    size={12}
                    color={themeColors.text.secondary}
                  />
                </View>
                <Text className="font-body-bold text-xs text-text-secondary">
                  Misafir {index + 1}
                </Text>
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => onRemoveGuest(guest.localId)}
              >
                <FontAwesome6
                  name="xmark"
                  size={14}
                  color={themeColors.destructive}
                />
              </Pressable>
            </View>
            <View className="flex-row gap-2">
              <GuestInput
                placeholder="Ad (opsiyonel)"
                value={guest.firstName}
                onChangeText={(value) =>
                  onUpdateGuest(guest.localId, "firstName", value)
                }
              />
              <GuestInput
                placeholder="Soyad (opsiyonel)"
                value={guest.lastName}
                onChangeText={(value) =>
                  onUpdateGuest(guest.localId, "lastName", value)
                }
              />
            </View>
          </View>
        ))}
      </View>

      <View className="gap-3">
        <View>
          <Text className="font-body-bold text-sm text-text-primary">
            Arkadaşlarından ekle
          </Text>
          <Text className="mt-0.5 font-body text-xs text-text-tertiary">
            Birden fazla arkadaş seçebilirsin.
          </Text>
        </View>

        {isFriendsLoading ? (
          <Text className="py-4 text-center font-body text-sm text-text-secondary">
            Arkadaşlar yükleniyor…
          </Text>
        ) : friends.length === 0 ? (
          <Text className="rounded-2xl border border-border-default bg-surface-primary px-4 py-5 text-center font-body text-sm text-text-secondary">
            Ekleyebileceğin kabul edilmiş arkadaş bulunamadı.
          </Text>
        ) : (
          <ScrollView
            className="max-h-[260px]"
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-2">
              {friends.map((friend) => {
                const selected = selectedFriendIds.includes(friend.userId);
                const disabled = !selected && remainingSlots <= 0;
                return (
                  <Pressable
                    key={friend.userId}
                    disabled={disabled}
                    onPress={() => onToggleFriend(friend.userId)}
                    className={`flex-row items-center gap-3 rounded-2xl border px-3.5 py-3 disabled:opacity-35 ${
                      selected
                        ? "border-brand-primary/50 bg-brand-primary/10"
                        : "border-border-default bg-surface-primary"
                    }`}
                  >
                    <Avatar
                      uri={friend.profileImageUrl}
                      name={friend.username || friend.firstName}
                      size={44}
                      borderWidth={0}
                    />
                    <View className="flex-1">
                      <Text className="font-body-bold text-sm text-text-primary">
                        @{friend.username || "sporcu"}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full border ${
                        selected
                          ? "border-brand-primary bg-brand-primary"
                          : "border-border-strong bg-transparent"
                      }`}
                    >
                      {selected ? (
                        <FontAwesome6
                          name="check"
                          size={10}
                          color={themeColors.text.onPrimary}
                        />
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function GuestInput({
  placeholder,
  value,
  onChangeText,
}: {
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      maxLength={50}
      placeholder={placeholder}
      placeholderTextColor={themeColors.text.tertiary}
      className="min-h-[46px] flex-1 rounded-xl border border-border-default bg-surface-secondary px-3 font-body text-sm text-text-primary"
    />
  );
}
