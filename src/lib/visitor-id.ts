import { z } from "zod";

const STORAGE_KEY = "toolbay_visitor_id";

/** Placeholder stored on page views recorded before visitor IDs existed; never counted as a unique visitor. */
export const ANONYMOUS_VISITOR = "anonymous";

export const visitorIdSchema = z
  .string()
  .regex(/^[A-Za-z0-9-]{8,64}$/)
  .optional();

/**
 * A random ID for this browser, kept in localStorage so unique visitors can be
 * counted for any time range. Falls back to a per-page-load ID when storage is blocked.
 */
export function getVisitorId(): string {
  const fresh = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && visitorIdSchema.safeParse(existing).success) return existing;
    const id = fresh();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return fresh();
  }
}
