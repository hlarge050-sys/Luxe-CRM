// Public health check, excluded from the auth guard in src/proxy.ts.
// Reports whether the app is up, the database reachable and the schema
// migrated. No business data leaves this endpoint.
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return Response.json(
      { ok: false, db: "unset", schema: "unknown" },
      { status: 503 },
    );
  }

  const sql = neon(url);
  try {
    await sql`select 1`;
  } catch {
    return Response.json(
      { ok: false, db: "error", schema: "unknown" },
      { status: 503 },
    );
  }

  try {
    const rows = await sql`select count(*)::int as n from job_stages`;
    const stages = (rows[0] as { n: number }).n;
    return Response.json({
      ok: true,
      db: "ok",
      schema: "migrated",
      stages,
      version: "m2r1",
    });
  } catch {
    return Response.json(
      { ok: false, db: "ok", schema: "pending" },
      { status: 503 },
    );
  }
}
