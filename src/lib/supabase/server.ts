import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./middleware";

export async function createClient() {
  const cookieStore = await cookies();

  if (!isSupabaseConfigured()) {
    // Return a graceful mock client for local/demo mode
    return {
      auth: {
        getUser: async () => {
          const demoCookie = cookieStore.get("forge_demo_user");
          if (process.env.FORGE_DEMO_MODE !== "true" || !demoCookie) {
            return { data: { user: null }, error: null };
          }
          try {
            const parsed = JSON.parse(demoCookie.value);
            if (typeof parsed?.email !== "string" || !parsed.email) return { data: { user: null }, error: null };
            return {
              data: {
                user: {
                  id: "00000000-0000-0000-0000-000000000001",
                  email: parsed.email || "student@forge.dev",
                  user_metadata: { full_name: parsed.fullName || "Rahul Sharma" },
                },
              },
              error: null,
            };
          } catch {
            return { data: { user: null }, error: null };
          }
        },
        signOut: async () => ({ error: null }),
      },
      from: () => { throw new Error("Database access is unavailable in demo mode. Use the demo repository."); },
    } as unknown as ReturnType<typeof createServerClient>;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    }
  );
}
