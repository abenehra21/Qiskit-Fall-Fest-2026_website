import { headers } from "next/headers";
import { getDb } from "@/lib/db";

/**
 * Rate limiting for the registration endpoint.
 *
 * The counter lives in Postgres rather than in process memory. On Vercel each
 * request may be served by a different instance, and an in-memory Map would
 * reset on every cold start — the effective limit becomes "per instance",
 * which for a serverless deployment is close to no limit at all. The database
 * is already a dependency and is shared by definition, so it is the cheapest
 * correct place to count.
 *
 * ponytail: fixed window, not sliding. An attacker who lines up with a window
 * boundary can send 2× the limit across the seam. A sliding window needs a row
 * per request instead of a row per window; revisit if that burst matters.
 */

/**
 * Whether this instance has already satisfied itself the counter table exists.
 * Only an optimisation — it saves re-running the CREATE on the happy path.
 */
let tableEnsured = false;

/** Create the counter table. Idempotent, so concurrent callers cannot collide. */
async function ensureTable(sql: ReturnType<typeof getDb>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      bucket       TEXT NOT NULL,
      window_start TIMESTAMPTZ NOT NULL,
      hits         INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (bucket, window_start)
    );
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_hits (window_start);
  `;
  tableEnsured = true;
}

/** One UPSERT per attempt, returning the new count. Atomic under concurrency. */
async function bump(bucket: string, windowMs: number): Promise<number> {
  const sql = getDb();
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const upsert = async () =>
    (await sql`
      INSERT INTO rate_limit_hits (bucket, window_start, hits)
      VALUES (${bucket}, ${windowStart.toISOString()}, 1)
      ON CONFLICT (bucket, window_start)
      DO UPDATE SET hits = rate_limit_hits.hits + 1
      RETURNING hits;
    `) as { hits: number }[];

  let rows: { hits: number }[];
  try {
    rows = await upsert();
  } catch (err) {
    // 42P01 = undefined_table. The table ships in schema.sql, but that
    // migration is applied by hand and a deploy can easily land before anyone
    // runs it — which would leave the endpoint silently unlimited. Rather than
    // depend on someone remembering, create it on first use and retry once.
    //
    // This is the only DDL the app issues. It is idempotent, it runs at most
    // once per instance on the happy path, and if the database role cannot
    // create tables the error propagates to the caller, which fails open.
    if ((err as { code?: string })?.code !== "42P01" || tableEnsured) throw err;
    console.warn("rate_limit_hits was missing; creating it now.");
    await ensureTable(sql);
    rows = await upsert();
  }

  tableEnsured = true;
  return rows[0]?.hits ?? 1;
}

/**
 * The caller's IP, as reported by the proxy in front of the app.
 *
 * x-forwarded-for is client-controlled on a bare origin, so this is only
 * trustworthy behind a proxy that overwrites it — which Vercel does. The
 * left-most entry is the original client; anything after it was appended by
 * intermediaries.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return h.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * Allow `limit` attempts per `windowMs` for one bucket key.
 *
 * Fails open. If the counter query itself errors the registration proceeds —
 * a limiter that takes the whole form down when the database hiccups causes
 * more harm than the abuse it prevents.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  try {
    const hits = await bump(key, windowMs);
    if (hits > limit) {
      const elapsed = Date.now() % windowMs;
      return { ok: false, retryAfterSeconds: Math.ceil((windowMs - elapsed) / 1000) };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch (err) {
    // 42P01 = undefined_table. The counter table ships in schema.sql but the
    // migration is applied by hand, so this is the expected failure the first
    // time this code meets a database that has not had it run. Registration
    // still proceeds — it is just unlimited until the table exists.
    // Reaching here means even the self-heal above did not work — most likely
    // the database role is not allowed to create tables. Say so plainly,
    // because the endpoint is unlimited until someone acts on it.
    const code = (err as { code?: string })?.code;
    if (code === "42P01" || code === "42501") {
      console.error(
        "Rate limiting is INACTIVE: rate_limit_hits is missing and could not be " +
          "created automatically. Run `npm run db:init` against this database.",
      );
    } else {
      console.error("Rate limit check failed, allowing the request:", code ?? err);
    }
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/** Drop windows nobody can still be inside. Cheap, and only runs occasionally. */
export async function sweepRateLimits(): Promise<void> {
  if (Math.random() > 0.02) return;
  try {
    const sql = getDb();
    await sql`DELETE FROM rate_limit_hits WHERE window_start < NOW() - INTERVAL '1 day';`;
  } catch {
    // Housekeeping only — a failure here must never affect a registration.
  }
}
