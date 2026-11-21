import { createClient } from "@supabase/supabase-js";
import "server-only";
// Only called after server-side user verification. Never import into client components.
export function assessmentAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw Error(
      "Assessment server storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server only.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
