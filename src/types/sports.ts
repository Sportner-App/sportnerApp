import type { IconName } from "./components";

export type Sport = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
};

export type SportCategory = {
  key: string;
  label: string;
  icon: IconName;
};

export type ListSportsParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type SportsPage = {
  items: Sport[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};
