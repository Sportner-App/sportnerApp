import { getApiErrorMessage } from "@/lib/api/errors";
import type { EventActionResult } from "@/features/events/types";

export async function eventAction(
  run: () => Promise<unknown>,
  fallback: string,
): Promise<EventActionResult<null>> {
  try {
    await run();
    return { error: null, data: null };
  } catch (error) {
    return {
      error: { message: getApiErrorMessage(error, fallback) },
      data: null,
    };
  }
}
