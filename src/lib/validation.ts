/**
 * Input validation for the registration boundary.
 *
 * The form is the only place untrusted data enters this application, and it
 * reaches the database through two doors — the server action the form calls
 * directly, and the public REST route that wraps it. Everything here is
 * enforced inside the action, so both doors get the same treatment.
 *
 * The rules mirror the column widths in src/lib/db/schema.sql. Where the
 * schema has no width (github_url, linkedin_url and the interests array are
 * TEXT), a cap is imposed here instead: without one a single request can
 * store an arbitrarily large row.
 */

/** Longest value accepted per field, matched to the schema where it has one. */
export const LIMITS = {
  fullName: 120,
  email: 254, // RFC 5321 maximum for a forward path
  phone: 32,
  institution: 200,
  studyLevel: 100,
  graduationYear: 12,
  quantumExperience: 50,
  tshirtSize: 50,
  url: 200,
  referralCode: 20,
  interest: 80,
  interestCount: 12,
} as const;

/** Total accepted request body, before anything is parsed out of it. */
export const MAX_BODY_BYTES = 16 * 1024;

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Trim, then reject anything longer than the cap.
 *
 * Truncating silently would be friendlier but it lies: the attendee would be
 * told their registration succeeded while holding a name the database never
 * stored in full.
 */
export function takeText(
  value: unknown,
  field: string,
  max: number,
  errors: FieldError[],
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) {
    errors.push({
      field,
      message: `${field} must be ${max} characters or fewer.`,
    });
    return null;
  }
  return trimmed;
}

/** Accept only a value the form itself offers. */
export function takeOption(
  value: unknown,
  field: string,
  allowed: readonly string[],
  errors: FieldError[],
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!allowed.includes(trimmed)) {
    errors.push({ field, message: `${field} is not one of the offered options.` });
    return null;
  }
  return trimmed;
}

/**
 * Accept only an http(s) URL.
 *
 * Nothing renders these today, but they are stored and an organiser dashboard
 * will eventually put them in an href. A `javascript:` or `data:` value saved
 * now becomes stored XSS the day that page is written, so the scheme is pinned
 * at the point of entry rather than at the point of display.
 */
export function takeUrl(
  value: unknown,
  field: string,
  errors: FieldError[],
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > LIMITS.url) {
    errors.push({ field, message: `${field} must be ${LIMITS.url} characters or fewer.` });
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    errors.push({ field, message: `${field} must be a full URL, starting with https://.` });
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    errors.push({ field, message: `${field} must be an http or https link.` });
    return null;
  }
  return parsed.toString();
}

/** Bound both the number of interests and the size of each one. */
export function takeInterests(value: unknown, errors: FieldError[]): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length > LIMITS.interestCount) {
    errors.push({
      field: "interests",
      message: `Please choose ${LIMITS.interestCount} interests or fewer.`,
    });
    return [];
  }
  const cleaned: string[] = [];
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    if (trimmed.length > LIMITS.interest) {
      errors.push({ field: "interests", message: "One of the interests is too long." });
      return [];
    }
    cleaned.push(trimmed);
  }
  return cleaned;
}
