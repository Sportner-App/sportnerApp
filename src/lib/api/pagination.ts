import type { CursorPagedResult } from "@/types/api";

/**
 * İmleç tabanlı yanıtı güvenli biçime getirir: eksik `items` boş liste,
 * eksik `nextCursor` null olur. `map` verilirse öğeler dönüştürülür.
 */
export function toCursorPage<T, R = T>(
  data: CursorPagedResult<T> | null | undefined,
  map?: (item: T) => R,
): CursorPagedResult<R> {
  const items = data?.items ?? [];
  return {
    items: map ? items.map(map) : (items as unknown as R[]),
    nextCursor: data?.nextCursor ?? null,
  };
}
