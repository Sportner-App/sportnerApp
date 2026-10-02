export type ApiBadge = {
  id: string;
  badgeId?: string;
  code: string;
  name: string;
  description: string;
  iconPath: string;
  earnedAt?: string;
  isShowcased?: boolean;
  earned?: boolean;
  current?: number;
  target?: number;
  percent?: number;
};

export type ApiQuest = {
  id: string;
  code: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  percent: number;
  status: number | null;
  completedAt: string | null;
};
