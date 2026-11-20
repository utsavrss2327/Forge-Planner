import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/middleware";
import { exportDemoData } from "@/lib/storage/account";

export async function GET() {
  const db = await createClient(); const { data: { user }, error: authError } = await db.auth.getUser();
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  if (authError || !user) return Response.json({ error: "Authentication required." }, { status: 401, headers });
  const demo = !isSupabaseConfigured();
  let data;
  if (demo) data = exportDemoData(user.id);
  else {
    const result = await db.rpc("export_preparation_data");
    if (result.error) return Response.json({ error: "Your export could not be generated. Please retry." }, { status: 503, headers });
    data = result.data;
  }
  return Response.json({ format: "forge-export-v1", exported_at: new Date().toISOString(), demo, data },
    { headers: { ...headers, "Content-Disposition": 'attachment; filename="forge-data.json"' } });
}
