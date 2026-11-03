import { apiClient } from "@/lib/api/client";
import type { MonthlyRecap, YearlyRecap } from "@/features/recaps/types";

/** Kendi aylık özetin; `month` (YYYY-MM) verilmezse geçen ay. */
export async function getMonthlyRecap(month?: string): Promise<MonthlyRecap | null> {
  const response = await apiClient.get<MonthlyRecap>("/api/recaps/monthly", {
    params: { month },
  });
  return response.data ?? null;
}

/** Yıllık özet (Wrapped); `year` verilmezse 15 Aralık'tan itibaren bu yıl. */
export async function getYearlyRecap(year?: number): Promise<YearlyRecap | null> {
  const response = await apiClient.get<YearlyRecap>("/api/recaps/yearly", {
    params: { year },
  });
  return response.data ?? null;
}
