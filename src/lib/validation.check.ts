/**
 * Self-check for the registration validators.
 *
 * No framework: run it with `npm run check:validation`. These are the rules
 * that stand between a hand-rolled POST and the database, so they get a test
 * that fails loudly if someone loosens one by accident.
 */

import assert from "node:assert/strict";
import {
  LIMITS,
  takeInterests,
  takeOption,
  takeText,
  takeUrl,
  type FieldError,
} from "./validation.ts";

function errs(): FieldError[] {
  return [];
}

// --- takeText -------------------------------------------------------------
{
  const e = errs();
  assert.equal(takeText("  Ada Lovelace  ", "Name", 120, e), "Ada Lovelace", "trims");
  assert.equal(e.length, 0);
}
{
  const e = errs();
  assert.equal(takeText("x".repeat(121), "Name", 120, e), null, "rejects over the cap");
  assert.equal(e.length, 1, "and records why");
}
{
  const e = errs();
  assert.equal(takeText("x".repeat(120), "Name", 120, e), "x".repeat(120), "cap is inclusive");
  assert.equal(e.length, 0);
}
{
  const e = errs();
  assert.equal(takeText(12345, "Name", 120, e), null, "a non-string is not a name");
  assert.equal(takeText("   ", "Name", 120, e), null, "whitespace is empty");
}

// --- takeOption -----------------------------------------------------------
{
  const e = errs();
  const allowed = ["beginner", "intermediate"];
  assert.equal(takeOption("beginner", "Level", allowed, e), "beginner");
  assert.equal(e.length, 0);
  assert.equal(takeOption("admin", "Level", allowed, e), null, "rejects off-list values");
  assert.equal(e.length, 1);
}

// --- takeUrl --------------------------------------------------------------
{
  const e = errs();
  assert.equal(
    takeUrl("https://github.com/someone", "GitHub", e),
    "https://github.com/someone",
  );
  assert.equal(e.length, 0);
}
for (const hostile of [
  "javascript:alert(document.cookie)",
  "data:text/html;base64,PHNjcmlwdD4=",
  "vbscript:msgbox(1)",
  "file:///etc/passwd",
]) {
  const e = errs();
  assert.equal(takeUrl(hostile, "GitHub", e), null, `rejects ${hostile}`);
  assert.equal(e.length, 1, `and explains: ${hostile}`);
}
{
  const e = errs();
  assert.equal(takeUrl("not a url", "GitHub", e), null, "rejects nonsense");
  assert.equal(takeUrl("https://" + "a".repeat(LIMITS.url), "GitHub", e), null, "caps length");
}

// --- takeInterests --------------------------------------------------------
{
  const e = errs();
  assert.deepEqual(takeInterests(["QML", " QAOA "], e), ["QML", "QAOA"], "trims each");
  assert.equal(e.length, 0);
}
{
  const e = errs();
  const tooMany = Array.from({ length: LIMITS.interestCount + 1 }, (_, i) => `i${i}`);
  assert.deepEqual(takeInterests(tooMany, e), [], "rejects an oversized array");
  assert.equal(e.length, 1);
}
{
  const e = errs();
  assert.deepEqual(takeInterests([{ evil: true }, "QML"], e), ["QML"], "drops non-strings");
  assert.deepEqual(takeInterests("not an array", e), [], "a string is not a list");
}
{
  const e = errs();
  assert.deepEqual(takeInterests(["x".repeat(LIMITS.interest + 1)], e), [], "caps each entry");
  assert.equal(e.length, 1);
}

console.log("validation self-check: all assertions passed");
