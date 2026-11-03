export type MonthlyRecapSport = {
  name: string;
  slug: string;
  eventsPlayed: number;
};

export type MonthlyRecapPartner = {
  userId: string;
  username: string;
  fullName: string;
  profileImageUrl: string | null;
  eventsTogether: number;
};

export type MonthlyRecap = {
  /** YYYY-MM */
  month: string;
  /** En az 2 etkinlik yoksa özet gösterilmez. */
  isReady: boolean;
  eventsPlayed: number;
  previousMonthEventsPlayed: number;
  minutesPlayed: number;
  sportsCount: number;
  topSports: MonthlyRecapSport[];
  teammatesCount: number;
  topPartner: MonthlyRecapPartner | null;
  topDistrict: string | null;
  districtsCount: number;
  /** 0 = Pazar … 6 = Cumartesi */
  busiestWeekday: number | null;
  medals: { title: string; icon: string }[];
  crownDistrict: string | null;
};

export type YearlyRecapPersona =
  | "explorer"
  | "captain"
  | "teamPlayer"
  | "unstoppable"
  | "weekendWarrior"
  | "risingStar";

export type YearlyRecap = {
  year: number;
  isReady: boolean;
  eventsPlayed: number;
  eventsOrganized: number;
  minutesPlayed: number;
  sportsCount: number;
  topSports: MonthlyRecapSport[];
  teammatesCount: number;
  topPartners: MonthlyRecapPartner[];
  topDistrict: string | null;
  districtsCount: number;
  busiestWeekday: number | null;
  /** 1–12 */
  busiestMonth: number | null;
  /** Ocak → Aralık */
  monthlyCounts: number[];
  longestStreakWeeks: number;
  medals: { title: string; icon: string }[];
  crowns: { month: number; district: string }[];
  persona: YearlyRecapPersona;
};
