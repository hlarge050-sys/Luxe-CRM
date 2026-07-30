// Applies pending Drizzle migrations before the build. On Vercel the Neon
// integration injects DATABASE_URL, so every deploy lands with the schema in
// step and never drifts. Locally, a missing DATABASE_URL just skips the step
// so `npm run build` still works as a dry check.
import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL;
const onVercel = Boolean(process.env.VERCEL);

if (!url) {
  if (onVercel) {
    console.error(
      "DATABASE_URL is not set on Vercel. Connect the Neon integration, then redeploy.",
    );
    process.exit(1);
  }
  console.log("DATABASE_URL not set, skipping migrations (local build check).");
  process.exit(0);
}

console.log("Applying database migrations before build...");
const result = spawnSync("npx", ["--no-install", "drizzle-kit", "migrate"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(result.status ?? 1);
