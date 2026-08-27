import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

import { useSession } from "@/contexts";
import { getMyProfile } from "@/services/profile-service";
import type { UserProfile } from "@/types/profile";
import { Avatar } from "./avatar";
import { BrandMark } from "./brand-mark";

export function TabScreenHeader() {
  const router = useRouter();
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void getMyProfile()
        .then((next) => {
          if (active) setProfile(next);
        })
        .catch(() => {
          // Session bilgisi header'ı kullanılabilir tutar.
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;
  const displayName = profile?.fullName ?? user?.fullName ?? user?.username;

  return (
    <View className="flex-row items-center justify-between py-2">
      <BrandMark />
      <Avatar
        uri={avatarUrl}
        name={displayName}
        size={44}
        borderWidth={2}
        onPress={() => router.navigate("/(tabs)/profile")}
        accessibilityLabel="Profiline git"
      />
    </View>
  );
}
