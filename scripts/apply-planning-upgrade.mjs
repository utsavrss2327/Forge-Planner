// Explicit incremental deployment only. Never replays the historical bootstrap.
import { readFile, writeFile, appendFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const project = "zcgsdaboiqrrzxdfturq",
  token = process.env.SUPABASE_ACCESS_TOKEN;
if (
  !token ||
  new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname !==
    `${project}.supabase.co`
)
  throw Error("Expected project and management token are required.");
const root = `https://api.supabase.com/v1/projects/${project}`;
async function request(path, method = "GET", body) {
  const r = await fetch(root + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(60000),
  });
  if (!r.ok)
    throw Error(
      `Supabase ${method} ${path}: HTTP ${r.status}. Inspect history before retrying.`,
    );
  return r.json();
}
const receiptFile = "supabase/planning-upgrade-receipt.json";
let receipt = { project, applied: [] };
try {
  receipt = JSON.parse(await readFile(receiptFile, "utf8"));
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
try {
  let history = await request("/database/migrations");
  if (
    !history.some((m) => m.name === "forge_foundation_00001_to_00005") ||
    !history.some((m) => m.name === "00006_rpc_execution_grants")
  )
    throw Error("Expected verified foundation history is missing.");
  for (const name of [
    "00007_routine_planning",
    "00008_grounded_assessments",
    "00009_routine_task_guards",
  ]) {
    const sql = await readFile(`supabase/migrations/${name}.sql`, "utf8"),
      hash = createHash("sha256").update(sql).digest("hex");
    const existing = history.find((m) => m.name === name);
    if (existing) {
      if (
        !receipt.applied.some(
          (m) =>
            m.name === name &&
            m.sha256 === hash &&
            m.version === existing.version,
        )
      )
        throw Error(
          `Existing ${name} has no matching local receipt. Review before continuing.`,
        );
      continue;
    }
    await appendFile(
      "WORK_LOG.md",
      `\nApplying tested incremental migration ${name} (SHA256 ${hash}) through the Management API. No bootstrap/sample-data/reset queries are included.\n`,
    );
    await request("/database/migrations", "POST", {
      name,
      query: `BEGIN;\n${sql}\nCOMMIT;`,
    });
    history = await request("/database/migrations");
    const entry = history.find((m) => m.name === name);
    if (!entry)
      throw Error(
        `${name}: migration history was not verified. Do not rerun blindly.`,
      );
    receipt.applied.push({
      name,
      version: entry.version,
      sha256: hash,
      appliedAt: new Date().toISOString(),
    });
    await writeFile(receiptFile, JSON.stringify(receipt, null, 2) + "\n");
    console.log({ applied: name, version: entry.version });
  }
  const checks = await request("/database/query", "POST", {
    read_only: true,
    query: `SELECT count(*)::int tables,count(*) FILTER(WHERE rowsecurity)::int rls_tables FROM pg_tables WHERE schemaname='public';`,
  });
  receipt.verifiedAt = new Date().toISOString();
  receipt.database = checks[0];
  await writeFile(receiptFile, JSON.stringify(receipt, null, 2) + "\n");
  await appendFile(
    "WORK_LOG.md",
    `\nIncremental planning/assessment migration history verified. Database: ${JSON.stringify(checks[0])}. Receipt: ${receiptFile}. No user content was created, reset or deleted by provisioning.\n`,
  );
  console.log({ verified: checks[0] });
} catch (error) {
  console.error(error.message.split(token).join("[REDACTED]"));
  process.exitCode = 1;
}
