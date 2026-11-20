import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url === "your_supabase_url" || key === "your_supabase_anon_key") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  const publicPaths = ["/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  if (!isSupabaseConfigured()) {
    let validDemo = false;
    try {
      const value = JSON.parse(request.cookies.get("forge_demo_user")?.value ?? "null");
      validDemo = process.env.FORGE_DEMO_MODE === "true" && typeof value?.email === "string" && value.email.length > 0;
    } catch { /* A malformed demo cookie is an unauthenticated request. */ }
    if (!validDemo && !isPublicPath) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      const url = request.nextUrl.clone(); url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (validDemo && ["/login", "/signup"].includes(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone(); url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();


    if (!user && !isPublicPath) {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && !isPublicPath && !["/onboarding", "/settings"].includes(request.nextUrl.pathname) && !request.nextUrl.pathname.startsWith("/api/account/")) {
      const { data: profile, error } = await supabase.from("profiles").select("onboarding_completed").eq("id", user.id).maybeSingle();
      if (error) return new NextResponse("Your preparation profile is temporarily unavailable. Please retry.", { status: 503 });
      if (!profile?.onboarding_completed) {
        const url = request.nextUrl.clone(); url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    if (
      user &&
      (request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/signup")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  } catch (err) {
    console.error("Session verification failed:", err);
    if (!["/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/callback"].includes(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone(); url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
