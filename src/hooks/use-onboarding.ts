import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  ONBOARDING_COPY,
  ONBOARDING_SEARCH_DEBOUNCE_MS,
  ONBOARDING_SEARCH_MIN_CHARS,
} from "@/constants/onboarding";
import { useSession, useToast } from "@/contexts";
import { useCities } from "@/hooks/use-cities";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  addMySportSafe,
  completeOnboarding,
  createMyProfile,
  markLocalOnboardingComplete,
  upsertOnboardingProfileDetails,
} from "@/services/onboarding-service";
import {
  updatePersonalDetails,
  uploadAvatar,
  uploadIntroVideo,
} from "@/services/profile-service";
import { listSports } from "@/services/sports-service";
import { useSportCategories } from "@/hooks/use-sport-categories";
import type { OnboardingSportDraft, OnboardingStep } from "@/types/onboarding";
import type { Sport } from "@/types/sports";
import {
  mediaDeniedMessage,
  pickIntroVideo,
  pickProfileImage,
  type MediaSource,
  type PickedMedia,
} from "@/utils/media-picker";

const USERNAME_PATTERN = /^[a-zA-Z0-9._]+$/;

type IdentityFieldErrors = {
  username?: string;
  firstName?: string;
  birthDate?: string;
};

/** Gender isn't collected on the social-signup identity step; default to "prefer not to say". */
const DEFAULT_IDENTITY_GENDER = 0;

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

function suggestUsername(firstName?: string, lastName?: string) {
  const base = `${firstName ?? ""}${lastName ?? ""}`
    .toLowerCase()
    .replace(/[çğıöşü]/g, (char) => TURKISH_CHAR_MAP[char] ?? char)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20);

  const suffix = Math.floor(1000 + Math.random() * 9000);

  return `${base || "sporcu"}${suffix}`;
}

function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

function isAllowedBirthDate(date: Date) {
  const today = new Date();
  const youngest = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate(),
  );
  const oldest = new Date(
    today.getFullYear() - 120,
    today.getMonth(),
    today.getDate(),
  );
  return date >= oldest && date <= youngest;
}

function toApiBirthDate(value: string) {
  const [day, month, year] = value.trim().split(".");
  return `${year}-${month}-${day}`;
}

function formatBirthDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

export function useOnboarding() {
  const router = useRouter();
  const { refreshSession, user } = useSession();
  const { showToast } = useToast();

  // Username and birth date are completed before a social-auth session is created.
  // Starting from the sports step also avoids briefly rendering a duplicate identity
  // screen while the persisted session user is still hydrating.
  const [step, setStep] = useState<OnboardingStep>("sports");
  const [username, setUsername] = useState(() =>
    suggestUsername(user?.firstName, user?.lastName),
  );
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [birthDateState, setBirthDateState] = useState("");
  const [identityFieldErrors, setIdentityFieldErrors] =
    useState<IdentityFieldErrors>({});
  const [isIdentitySubmitting, setIsIdentitySubmitting] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isSportsLoading, setIsSportsLoading] = useState(true);
  const [selected, setSelected] = useState<OnboardingSportDraft[]>([]);
  const [primarySportId, setPrimarySportId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [groupKey, setGroupKey] = useState("all");
  const [editingSportId, setEditingSportId] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<PickedMedia | null>(null);
  const [video, setVideo] = useState<PickedMedia | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    options: cityOptions,
    isLoading: isCitiesLoading,
    error: citiesError,
  } = useCities();
  const { categories: sportCategories } = useSportCategories();

  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    // 1 char: wait for 2nd (or clear) — do not hit the API.
    if (trimmed.length > 0 && trimmed.length < ONBOARDING_SEARCH_MIN_CHARS) {
      return;
    }

    const search =
      trimmed.length >= ONBOARDING_SEARCH_MIN_CHARS ? trimmed : undefined;
    const delayMs = search ? ONBOARDING_SEARCH_DEBOUNCE_MS : 0;

    const timer = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      setIsSportsLoading(true);

      void (async () => {
        try {
          const catalog = await listSports({
            search,
            page: 1,
            pageSize: 50,
          });
          if (requestId !== requestIdRef.current) {
            return;
          }
          setSports(catalog);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          showToast({
            type: "error",
            title: "Sporlar yüklenemedi",
            description: getApiErrorMessage(error),
          });
        } finally {
          if (requestId === requestIdRef.current) {
            setIsSportsLoading(false);
          }
        }
      })();
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [query, showToast]);

  const canContinueSports = selected.length > 0 && Boolean(primarySportId);

  const isSearchTooShort =
    query.trim().length > 0 &&
    query.trim().length < ONBOARDING_SEARCH_MIN_CHARS;

  const filteredSports = useMemo(() => {
    const sorted = [...sports].sort((a, b) => a.displayOrder - b.displayOrder);

    if (groupKey === "all") {
      return sorted;
    }

    return sorted.filter((sport) => sport.categoryId === groupKey);
  }, [groupKey, sports]);

  const editingDraft = useMemo(
    () => selected.find((item) => item.sportId === editingSportId) ?? null,
    [editingSportId, selected],
  );

  const toggleSport = (sport: Sport) => {
    setSelected((prev) => {
      const exists = prev.find((item) => item.sportId === sport.id);
      if (exists) {
        const next = prev.filter((item) => item.sportId !== sport.id);
        setPrimarySportId((current) => {
          if (current !== sport.id) {
            return current;
          }
          return next[0]?.sportId ?? null;
        });
        setEditingSportId((current) =>
          current === sport.id ? (next[0]?.sportId ?? null) : current,
        );
        return next;
      }

      const draft: OnboardingSportDraft = {
        sportId: sport.id,
        sportSlug: sport.slug,
        sportName: sport.name,
        skillLevel: 1,
      };

      setPrimarySportId((current) => current ?? sport.id);
      setEditingSportId(sport.id);
      return [...prev, draft];
    });
  };

  const setSportSkill = (sportId: string, skillLevel: number) => {
    setSelected((prev) =>
      prev.map((item) =>
        item.sportId === sportId ? { ...item, skillLevel } : item,
      ),
    );
  };

  const goToDetails = () => {
    if (!canContinueSports) {
      showToast({
        type: "error",
        title: "Spor gerekli",
        description: "En az bir spor seç ve birincil sporunu belirle.",
      });
      return;
    }

    setEditingSportId(null);
    setStep("details");
  };

  const chooseAvatar = async (source: MediaSource) => {
    const picked = await pickProfileImage(source);
    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: mediaDeniedMessage(source),
      });
      return;
    }
    if (picked === "cancelled") {
      return;
    }
    setAvatar(picked);
  };

  const chooseVideo = async () => {
    const picked = await pickIntroVideo();
    if (picked === "denied") {
      showToast({
        type: "error",
        title: "İzin gerekli",
        description: "Video seçmek için galeri izni vermelisin.",
      });
      return;
    }
    if (picked === "cancelled") {
      return;
    }
    setVideo(picked);
  };

  const setBirthDate = (value: string) => {
    setBirthDateState(formatBirthDateInput(value));
  };

  const submitIdentity = async () => {
    if (isIdentitySubmitting) {
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const parsedBirthDate = parseBirthDate(birthDateState);

    const errors: IdentityFieldErrors = {};

    if (!trimmedUsername) {
      errors.username = "Kullanıcı adı gerekli.";
    } else if (trimmedUsername.length < 3) {
      errors.username = "Kullanıcı adı en az 3 karakter olmalı.";
    } else if (trimmedUsername.length > 30) {
      errors.username = "Kullanıcı adı en fazla 30 karakter olabilir.";
    } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
      errors.username =
        "Kullanıcı adı yalnızca harf, rakam, . ve _ içerebilir.";
    }

    if (!trimmedFirstName) {
      errors.firstName = "Ad gerekli.";
    } else if (trimmedFirstName.length > 50) {
      errors.firstName = "Ad en fazla 50 karakter olabilir.";
    }

    if (!birthDateState.trim()) {
      errors.birthDate = "Doğum tarihi gerekli.";
    } else if (!parsedBirthDate) {
      errors.birthDate = "Tarihi GG.AA.YYYY formatında gir.";
    } else if (!isAllowedBirthDate(parsedBirthDate)) {
      errors.birthDate = "Yaş 13 ile 120 arasında olmalı.";
    }

    setIdentityFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsIdentitySubmitting(true);

    try {
      const normalizedUsername = trimmedUsername.toLowerCase();

      await createMyProfile({
        username: normalizedUsername,
        firstName: trimmedFirstName,
        lastName: trimmedLastName || null,
      });
      await updatePersonalDetails(
        DEFAULT_IDENTITY_GENDER,
        toApiBirthDate(birthDateState),
      );

      const currentUser = await apiClient.getUser();
      await apiClient.setUser({
        ...currentUser,
        username: normalizedUsername,
        firstName: trimmedFirstName,
        lastName: trimmedLastName || undefined,
      });
      await refreshSession?.();

      setStep("sports");
    } catch (error) {
      showToast({
        type: "error",
        title: "Kaydedilemedi",
        description: getApiErrorMessage(error, "Bilgiler kaydedilemedi."),
      });
    } finally {
      setIsIdentitySubmitting(false);
    }
  };

  const finish = async () => {
    if (!canContinueSports || isSubmitting) {
      return;
    }

    if (!avatar && !user?.avatarUrl) {
      showToast({
        type: "error",
        title: "Profil fotoğrafı gerekli",
        description: "Devam etmek için bir profil fotoğrafı seçmelisin.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // One POST per selected sport (API has no batch endpoint).
      await Promise.all(
        selected.map((sport) =>
          addMySportSafe({
            sportId: sport.sportId,
            skillLevel: sport.skillLevel,
            isPrimary: sport.sportId === primarySportId,
          }),
        ),
      );

      await upsertOnboardingProfileDetails({
        city: city.trim() || undefined,
        bio: bio.trim() || undefined,
        username: user?.username,
        firstName: user?.firstName,
        lastName: user?.lastName,
      });

      if (avatar) {
        await uploadAvatar(avatar);
      }

      if (video) {
        await uploadIntroVideo(video);
      }

      const { error } = await completeOnboarding();

      if (error) {
        showToast({
          type: "error",
          title: "Tamamlanamadı",
          description: error.message,
        });
        return;
      }

      await markLocalOnboardingComplete();
      await refreshSession?.();

      showToast({
        type: "success",
        title: ONBOARDING_COPY.toasts.successTitle,
        description: ONBOARDING_COPY.toasts.successDescription,
      });

      router.replace("/(tabs)");
    } catch (error) {
      showToast({
        type: "error",
        title: "Tamamlanamadı",
        description: getApiErrorMessage(
          error,
          ONBOARDING_COPY.toasts.saveFailed,
        ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    setStep,
    username,
    setUsername,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    identityBirthDate: birthDateState,
    setIdentityBirthDate: setBirthDate,
    identityFieldErrors,
    isIdentitySubmitting,
    submitIdentity,
    sports,
    filteredSports,
    sportCategories,
    isSportsLoading,
    isSearchTooShort,
    selected,
    primarySportId,
    setPrimarySportId,
    query,
    setQuery,
    groupKey,
    setGroupKey,
    editingSportId,
    setEditingSportId,
    editingDraft,
    city,
    setCity,
    cityOptions,
    isCitiesLoading,
    citiesError,
    bio,
    setBio,
    avatar,
    existingAvatarUrl: user?.avatarUrl ?? null,
    video,
    chooseAvatar,
    chooseVideo,
    clearAvatar: () => setAvatar(null),
    clearVideo: () => setVideo(null),
    isSubmitting,
    canContinueSports,
    canFinish: canContinueSports && Boolean(avatar || user?.avatarUrl),
    toggleSport,
    setSportSkill,
    goToDetails,
    finish,
  };
}
