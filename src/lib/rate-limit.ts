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

/** One UPSERT per attempt, returning the new count. Atomic under concurrency. */
async function bump(bucket: string, windowMs: number): Promise<number> {
  const sql = getDb();
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const rows = (await sql`
    INSERT INTO rate_limit_hits (bucket, window_start, hits)
    VALUES (${bucket}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (bucket, window_start)
    DO UPDATE SET hits = rate_limit_hits.hits + 1
    RETURNING hits;
  `) as { hits: number }[];

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
    console.error("Rate limit check failed, allowing the request:", err);
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
