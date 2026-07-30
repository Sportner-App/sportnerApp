export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type SkillLevelsMap = Record<string, SkillLevel>;

export type CompleteOnboardingPayload = {
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  birthDate: string | null;
  sports: string[];
  skillLevels: SkillLevelsMap;
};
