import type { IconName } from "./components";

export type Sport = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  displayOrder: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

/** API: SportCategoryResponse — katalog kategorisi (Takım Sporları, Raket Sporları…). */
export type SportCategory = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  sportCount: number;
};

/** Spor seçim listelerinde kullanılan görsel seçenek (chip / grid kartı). */
export type SportOption = {
  key: string;
  label: string;
  icon: IconName;
  /** Katalog kategorisi (seçim listelerinde alt satır olarak gösterilir). */
  description?: string;
  /** Katalog kategorisi id'si (sheet içi kategori filtresi için). */
  groupKey?: string;
};

export type ListSportsParams = {
  search?: string;
  categorySlug?: string;
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
