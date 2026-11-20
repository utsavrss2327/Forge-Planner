import "server-only";

export async function isGoogleProviderEnabled(fetcher: typeof fetch = fetch): Promise<boolean> {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!projectUrl || !publicKey) return false;
  const response = await fetcher(new URL("/auth/v1/settings", projectUrl), {
    headers: { apikey: publicKey }, cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Authentication provider settings could not be checked.");
  const settings = await response.json();
  return settings?.external?.google === true;
}
