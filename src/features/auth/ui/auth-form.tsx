import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Animated from "react-native-reanimated";

import { useSession } from "@/entities/session";
import { resolvePostAuthRoute } from "@/features/auth/api/auth-routing";
import { useAuth } from "@/features/auth/model/auth-context";
import { useAuthFormAnimation } from "@/features/auth/model/use-auth-form-animation";
import { useToast } from "@/shared/ui/toast-provider";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

type FieldKey = "name" | "email" | "password" | null;

type AuthFormProps = {
  initialMode?: "login" | "signup";
};

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const { signIn, signUp, isReady } = useAuth();
  const { showToast } = useToast();
  const { refreshSession } = useSession();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<FieldKey>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);

  const { trackAnimatedStyle } = useAuthFormAnimation(isLogin, viewportWidth);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) {
      return false;
    }

    return isLogin ? true : Boolean(name.trim());
  }, [email, isLogin, name, password]);

  const handleSubmit = async () => {
    if (!isReady) {
      showToast({
        type: "error",
        title: "Oturum hazir degil",
        description: "Lutfen birkaç saniye sonra tekrar deneyin.",
      });
      return;
    }

    if (!canSubmit) {
      showToast({
        type: "error",
        title: "Eksik alanlar var",
        description: "Devam etmek icin zorunlu alanlari doldurun.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = isLogin
        ? await signIn({ email: email.trim(), password })
        : await signUp({
            email: email.trim(),
            password,
            metadata: { full_name: name.trim() },
          });

      if (response.error) {
        showToast({
          type: "error",
          title: isLogin ? "Giris basarisiz" : "Kayit basarisiz",
          description: response.error.message,
        });
        return;
      }

      showToast({
        type: "success",
        title: isLogin ? "Giris basarili" : "Kayit olusturuldu",
        description: isLogin
          ? "Hesabina hos geldin."
          : "Eger gerekli ise email dogrulamasini tamamla.",
      });

      const userId = response.data.user?.id;

      if (userId) {
        // Session'ı hemen refresh et
        await refreshSession?.();

        const nextRoute = await resolvePostAuthRoute(userId);
        router.replace(nextRoute);
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Beklenmeyen bir hata olustu.";

      showToast({
        type: "error",
        title: "Islem tamamlanamadi",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-secondary"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="flex-grow justify-center px-5 py-10"
      >
        <View className="overflow-hidden rounded-[32px] border border-brand-tertiary bg-brand-surface shadow-2xl shadow-black/40">
          <View
            onLayout={(event) =>
              setViewportWidth(event.nativeEvent.layout.width)
            }
            className="overflow-hidden"
          >
            <Animated.View
              style={[
                {
                  flexDirection: "row",
                  width: viewportWidth > 0 ? viewportWidth * 2 : undefined,
                },
                trackAnimatedStyle,
              ]}
            >
              <View style={{ width: viewportWidth || undefined }}>
                <LoginForm
                  email={email}
                  password={password}
                  focusedField={focusedField as "email" | "password" | null}
                  isLoading={isLoading}
                  canSubmit={canSubmit}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onFocusChange={setFocusedField}
                  onSubmit={handleSubmit}
                  onModeChange={() => setIsLogin(false)}
                />
              </View>

              <View style={{ width: viewportWidth || undefined }}>
                <SignupForm
                  name={name}
                  email={email}
                  password={password}
                  focusedField={
                    focusedField as "name" | "email" | "password" | null
                  }
                  isLoading={isLoading}
                  canSubmit={canSubmit}
                  onNameChange={setName}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onFocusChange={setFocusedField}
                  onSubmit={handleSubmit}
                  onModeChange={() => setIsLogin(true)}
                />
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
