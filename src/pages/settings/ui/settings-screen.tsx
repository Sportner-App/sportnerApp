import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { useAuth } from "@/features/auth";
import { colors } from "@/shared/config/colors";
import { appTheme } from "@/shared/config/theme";
import { useAppTheme } from "@/shared/lib/get-theme";
import { Screen } from "@/shared/ui/screen";
import { SectionCard } from "@/shared/ui/section-card";
import { useToast } from "@/shared/ui/toast-provider";
import {
  BodyText,
  Eyebrow,
  LabelText,
  MonoLabel,
  PageTitle,
  SectionTitle,
} from "@/shared/ui/typography";

type SettingRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  trailing?: React.ReactNode;
};

function SettingRow({ icon, title, subtitle, trailing }: SettingRowProps) {
  return (
    <View className="flex-row items-center py-4">
      <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-brand-secondary">
        {icon}
      </View>
      <View className="flex-1">
        <LabelText className="text-white">{title}</LabelText>
        <BodyText className="mt-1">{subtitle}</BodyText>
      </View>
      {trailing ?? (
        <FontAwesome6 name="chevron-right" size={18} color="#64748b" />
      )}
    </View>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const theme = useAppTheme();
  const { showToast } = useToast();
  const { isAuthenticated, isReady, user, userEmail, userId, signOut } =
    useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const accountState = useMemo(() => {
    if (!isReady) {
      return "Oturum bilgisi yükleniyor";
    }

    return isAuthenticated ? "Aktif oturum açık" : "Oturum kapalı";
  }, [isAuthenticated, isReady]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      const result = await signOut();

      if (result.error) {
        showToast({
          type: "error",
          title: "Cikis basarisiz",
          description: result.error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: "Cikis yapildi",
        description: "Oturumun guvenli sekilde kapatildi.",
      });

      router.replace("/(auth)/login");
    } catch (caughtError) {
      const fallbackMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Çıkış işlemi sırasında beklenmeyen bir hata oluştu.";

      showToast({
        type: "error",
        title: "Cikis basarisiz",
        description: fallbackMessage,
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Eyebrow>Hesap</Eyebrow>
        <PageTitle>Ayarlar</PageTitle>
        <BodyText>
          Hesabını, oturumunu ve uygulama tercihlerinin giriş noktasını burada
          yönet.
        </BodyText>
      </View>

      <SectionCard style={{ backgroundColor: theme.surfaceRaised }}>
        <SectionTitle>Oturum özeti</SectionTitle>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <MonoLabel>Durum</MonoLabel>
            <LabelText className="mt-2 text-white">{accountState}</LabelText>
          </View>
          <View style={styles.summaryItem}>
            <MonoLabel>Kullanıcı</MonoLabel>
            <LabelText className="mt-2 text-white">
              {user?.user_metadata?.full_name ?? "Ad Soyad yok"}
            </LabelText>
          </View>
          <View style={styles.summaryItem}>
            <MonoLabel>E-posta</MonoLabel>
            <LabelText className="mt-2 text-white">
              {userEmail ?? "-"}
            </LabelText>
          </View>
          <View style={styles.summaryItem}>
            <MonoLabel>User ID</MonoLabel>
            <LabelText className="mt-2 text-white">{userId ?? "-"}</LabelText>
          </View>
        </View>
      </SectionCard>

      <SectionCard style={{ backgroundColor: theme.surface }}>
        <SectionTitle>Hesap ve sistem</SectionTitle>

        <SettingRow
          icon={
            <FontAwesome6 name="shield" size={18} color={colors.light.tint} />
          }
          title="Profil bilgileri"
          subtitle="Ad soyad ve iletişim bilgileri."
        />

        <View style={styles.divider} />

        <SettingRow
          icon={
            <FontAwesome6 name="mobile" size={18} color={colors.light.tint} />
          }
          title="Uygulama sürümü"
          subtitle="Sportner v1.0 · Expo"
          trailing={<MonoLabel>v1.0</MonoLabel>}
        />
      </SectionCard>

      <Pressable
        onPress={handleSignOut}
        disabled={isSigningOut || !isReady}
        style={[
          styles.signOutButton,
          { backgroundColor: theme.surfaceRaised, borderColor: theme.border },
          (isSigningOut || !isReady) && styles.signOutButtonDisabled,
        ]}
      >
        {isSigningOut ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <View style={styles.signOutContent}>
            <FontAwesome6 name="right-from-bracket" size={18} color="#fda4af" />
            <BodyText style={styles.signOutText}>Çıkış Yap</BodyText>
          </View>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8,
    paddingTop: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  summaryItem: {
    width: "48%",
    borderRadius: appTheme.radii.card,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(204,255,0,0.12)",
  },
  signOutButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: appTheme.radii.card,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  signOutText: {
    color: "#f8fafc",
  },
});
