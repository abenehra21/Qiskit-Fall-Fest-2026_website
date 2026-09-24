# Security

The site is a static marketing page plus one write endpoint. That endpoint is
the whole attack surface: it is public, unauthenticated, and it writes attendee
personal data into Postgres.

Two doors reach it — the registration form calls the `registerAttendee` server
action directly, and `POST /api/register` wraps that same action for external
clients. **Validation and rate limiting live inside the action**, so both doors
get the same treatment. Anything added to the route handler alone would leave
the form's path open.

## What is in place

| Area | Control |
|---|---|
| SQL injection | Every query uses Neon's tagged templates, including inside `sql.transaction()`. No string concatenation anywhere. |
| Input size | Every field is length-capped in `src/lib/validation.ts`, and the route rejects bodies over 16 KB before parsing. `github_url`, `linkedin_url` and `interests` are unbounded `TEXT` in the schema, so the cap has to be enforced in code. |
| Input shape | Study level, t-shirt size and experience are checked against the lists the form offers. URLs must parse and must be `http`/`https`. |
| Rate limiting | 10 attempts per IP per hour, counted in Postgres (`rate_limit_hits`), which is created on first use if missing. |
| Clickjacking | `frame-ancestors 'none'` plus `X-Frame-Options: DENY`. |
| Transport | HSTS, one year, `includeSubDomains`. Not preload-eligible by choice — see below. |
| Sniffing | `X-Content-Type-Options: nosniff`. |
| Referrer leakage | `strict-origin-when-cross-origin`. |
| Framework disclosure | `poweredByHeader: false`. |
| Registrant data caching | `/api/*` sends `no-store` and `X-Robots-Tag: noindex`. |
| Identifier predictability | Ticket IDs and referral codes both use the CSPRNG (`crypto.randomBytes` / `crypto.randomInt`). |
| Log hygiene | Database errors log the error code and constraint name only. The driver can echo a failing statement with its parameter values, which for this table means a registrant's name, email and phone. |
| Secrets | `.gitignore` covers `.env`, `.env.*`, `*.pem`, `*.key`. Only `.env.example` is committed. |

No new environment variables or third-party services are required — the rate
limiter reuses the database that is already configured.

## Before this ships

`schema.sql` adds a `rate_limit_hits` table, and the migration is applied by
hand — it is not part of `next build`. **Run it against the production database
when this deploys:**

```
npm run db:init
```

Until that runs, registration still works: the counter query fails, the limiter
fails open, and the server logs `Rate limiting is INACTIVE`. Nothing breaks, but
nothing is limited either.

## Known limits

**The CSP allows `'unsafe-inline'` for scripts.** Next.js emits inline bootstrap
and hydration scripts and `next-themes` inlines a script to avoid a flash of the
wrong theme. Removing it needs a per-request nonce, which forces dynamic
rendering on every page and gives up the static prerendering the whole site
relies on. The codebase currently has no injection sink — no
`dangerouslySetInnerHTML`, no `innerHTML`, no `eval` — so the trade is not worth
it today. **If an organiser dashboard is built that renders attendee-supplied
content, revisit this** and move the policy into a nonce in `proxy.ts` (Next 16
renamed `middleware.ts` to `proxy.ts`).

**Rate limiting uses a fixed window.** Someone who lines up with a window
boundary can send twice the limit across the seam. A sliding window costs a row
per request instead of a row per window.

**The limiter fails open.** If the counter query errors, the registration is
allowed through. A limiter that takes the form down when the database hiccups
would cause more harm than the abuse it prevents.

**HSTS does not declare `preload`.** The preload list is effectively permanent
and applies to the entire domain, which is not this project's decision to make
for whatever else lives under it. Add `preload` and raise `max-age` once every
host under the domain is confirmed HTTPS-only and someone has chosen to submit
it at hstspreload.org.

**`x-forwarded-for` is trusted.** That is correct behind Vercel, which
overwrites the header. It would not be correct on a bare origin, where a client
can set it freely.

**Duplicate emails and invalid referral codes produce distinct errors**, so both
can be probed for existence. The rate limit bounds how fast. Making them generic
would mean a registrant who already signed up could not be told so.

## Not addressed — needs a decision, not code

Registrant data is personal data: name, email, phone, institution, and
optionally LinkedIn and GitHub. There is no privacy policy, no stated retention
period, and no deletion path. India's DPDP Act 2023 applies directly, and GDPR
would apply to any EU students who register.

These are schema and process questions, not hardening:

- How long is registration data kept after the fest ends, and what deletes it?
- Who can query the table, and is that access logged?
- What happens when an attendee asks for their data to be removed?
- Is a privacy notice linked from the registration form before submission?

The schema is already designed to make this answerable — every row has a
`created_at` and a unique email — but nothing acts on it yet.

## Reporting

Please report suspected vulnerabilities privately to the qBITS organising team
rather than opening a public issue.
