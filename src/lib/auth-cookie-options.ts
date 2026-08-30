/**
 * Single source of truth for the Payload auth cookie's attributes
 * (sameSite / secure / domain).
 *
 * Previously these were duplicated in two places — the Users collection's
 * `auth.cookies` config (used by Payload's own /admin login) and the custom
 * `generateAuthCookie` helper (used by the storefront's tRPC login mutation)
 * — and had drifted out of sync (the storefront path used `SameSite=None`
 * while the admin path used `SameSite=Lax`). Two cookies with the same name
 * but different attributes can both end up in a user's cookie jar at once,
 * and which one a given request picks up is then effectively random —
 * producing intermittent "unauthenticated" errors. Keeping one definition
 * used by both call sites prevents that drift from happening again.
 *
 * Subdomain routing is intentionally disabled (NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING),
 * so the cookie never needs to be sent cross-subdomain — SameSite=Lax is
 * sufficient and avoids the stricter handling (and outright rejection by some
 * browsers/webviews, notably Safari/PWA contexts) that SameSite=None gets.
 */

const isLocalhost = !!process.env.NEXT_PUBLIC_ROOT_DOMAIN?.includes("localhost");

export const AUTH_COOKIE_SECURE = process.env.NODE_ENV === "production" && !isLocalhost;

export const AUTH_COOKIE_DOMAIN =
  process.env.NEXT_PUBLIC_ROOT_DOMAIN && !isLocalhost
    ? process.env.NEXT_PUBLIC_ROOT_DOMAIN
    : undefined;

/** Shape expected by Payload's `CollectionConfig.auth.cookies`. */
export function getPayloadAuthCookieOptions() {
  return {
    sameSite: "Lax" as const,
    secure: AUTH_COOKIE_SECURE,
    ...(AUTH_COOKIE_DOMAIN && { domain: AUTH_COOKIE_DOMAIN }),
  };
}

/** Shape expected by Next.js's `cookies().set()`. */
export function getNextAuthCookieOptions() {
  return {
    sameSite: "lax" as const,
    secure: AUTH_COOKIE_SECURE,
    ...(AUTH_COOKIE_DOMAIN && { domain: AUTH_COOKIE_DOMAIN }),
  };
}
