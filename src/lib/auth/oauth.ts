export const AUTH_MESSAGES: Record<string, string> = {
  oauth_cancelled: "Google sign-in was cancelled. You can try again.",
  oauth_failed: "Google sign-in could not be completed. Try again, or check the Google provider configuration in Supabase.",
  oauth_setup: "Google sign-in requires a configured Supabase project with the Google provider enabled.",
  auth_callback_error: "This sign-in link expired or could not be verified. Start sign-in again in this browser.",
};

export function callbackDestination(value: string | null): string {
  return value === "/reset-password" || value === "/settings" ? value : "/dashboard";
}

export function siteOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.username || url.password || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
    return url.origin;
  } catch { return null; }
}

export function isGoogleOnlyAccount(user: { identities?: { provider: string }[]; app_metadata?: { provider?: string } }): boolean {
  const providers = user.identities?.map((identity) => identity.provider) ?? [user.app_metadata?.provider];
  return providers.includes("google") && !providers.includes("email");
}

// Call only with signature-verified claims returned by Supabase auth.getClaims().
export function hasRecentGoogleAuthentication(claims: unknown, userId: string, now = Date.now() / 1000): boolean {
  if (!claims || typeof claims !== "object" || !("sub" in claims) || claims.sub !== userId || !("amr" in claims) || !Array.isArray(claims.amr)) return false;
  return claims.amr.some((entry: unknown) => {
    if (!entry || typeof entry !== "object" || !("method" in entry) || entry.method !== "oauth" || !("timestamp" in entry) || typeof entry.timestamp !== "number") return false;
    return Number.isFinite(entry.timestamp) && entry.timestamp <= now + 30 && now - entry.timestamp <= 300;
  });
}
