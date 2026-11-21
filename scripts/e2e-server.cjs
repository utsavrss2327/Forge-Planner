/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node test launcher. */
const { spawn } = require("node:child_process");
const next = require.resolve("next/dist/bin/next");
const env = {
  ...process.env,
  FORGE_BUILD_DIR: ".next-e2e",
  FORGE_DEMO_MODE: "true",
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  YOUTUBE_API_KEY: "",
  OPENAI_API_KEY: "",
  GEMINI_API_KEY: "",
  GROQ_API_KEY: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
};
// Build with credentials disabled too: NEXT_PUBLIC values can be inlined at build time.
let child = spawn(process.execPath, [next, "build", "--webpack"], {
  stdio: "inherit",
  env,
});
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    stopping = true;
    child.kill(signal);
  });
child.once("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once("exit", (code) => {
  if (code !== 0 || stopping) {
    process.exitCode = code ?? 1;
    return;
  }
  child = spawn(
    process.execPath,
    [next, "start", "--port", "3100", "--hostname", "127.0.0.1"],
    { stdio: "inherit", env },
  );
  child.once("exit", (serverCode) => {
    process.exitCode = serverCode ?? 0;
  });
});
