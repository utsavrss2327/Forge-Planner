import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";
import { callbackDestination } from "@/lib/auth/oauth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const destination = callbackDestination(searchParams.get("next"));
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  const failure = (error: string) => NextResponse.redirect(new URL(`/login?error=${error}`, origin), { headers });
  if (searchParams.has("error")) return failure(searchParams.get("error") === "access_denied" ? "oauth_cancelled" : "oauth_failed");
  if (!isSupabaseConfigured()) return failure("oauth_setup");
  const code = searchParams.get("code"), flowId = searchParams.get("sb_flow_id");
  if (!code || code.length > 2048 || (flowId && flowId.length > 200)) return failure("auth_callback_error");
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId ? { flowId } : undefined);
    if (error) return failure("auth_callback_error");
    return NextResponse.redirect(new URL(destination, origin), { headers });
  } catch { return failure("auth_callback_error"); }
}
