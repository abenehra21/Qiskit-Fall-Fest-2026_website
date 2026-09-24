import { neon } from "@neondatabase/serverless";

/**
 * Normalizes the database URL by removing a trailing inline comment.
 *
 * Splitting on the first "#" silently truncated any connection string whose
 * password contained one — a legal character that Neon does hand out — and the
 * resulting failure looks like bad credentials rather than a mangled URL. An
 * inline comment in a .env file is only a comment when the "#" follows
 * whitespace, so that is what is matched.
 */
function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || "";
  return raw.replace(/\s+#.*$/, "").trim();
}

/** Whether a database is configured at all. */
export function hasDatabase(): boolean {
  return getDatabaseUrl().length > 0;
}

/**
 * Returns a Neon SQL execution client for serverless/edge route handlers.
 * Uses HTTP fetch under the hood for zero connection pool latency.
 */
export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is missing. Please check your .env.local file."
    );
  }
  return neon(url);
}
