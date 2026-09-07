import { refresh } from "./auth";
import { ApiError } from "./client";

export async function withAuthRefresh<T>(
  action: () => Promise<T>,
  onUnauthorized: () => void,
): Promise<T | null> {
  try {
    return await action();
  } catch (caughtError) {
    if (caughtError instanceof ApiError && caughtError.status === 401) {
      try {
        await refresh();
        return await action();
      } catch {
        onUnauthorized();
        return null;
      }
    }

    throw caughtError;
  }
}
