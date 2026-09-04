import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { isAdminEmail, isAdminUserId, isAdminUserValue, isAllowedEmailValue } from "../lib/auth/allowlist-core.js";
import { mergeSyncSnapshots, parseSyncPayload } from "../lib/supabase/sync-core.js";

test("allowlist matching is case-insensitive and trims both addresses", () => {
  assert.equal(isAllowedEmailValue("  Owner@Example.com ", "owner@example.com"), true);
  assert.equal(isAllowedEmailValue("other@example.com", "owner@example.com"), false);
});

test("allowlist accepts comma, semicolon, and newline separated addresses", () => {
  const allowed = "first@example.com, second@example.com; third@example.com\nfourth@example.com";
  assert.equal(isAllowedEmailValue("SECOND@example.com", allowed), true);
  assert.equal(isAllowedEmailValue("other@example.com", allowed), false);
});

test("allowlist accepts a comma-separated set without changing single-email behavior", () => {
  assert.equal(isAllowedEmailValue("ANIRUDDH302004@GMAIL.COM", "owner@example.com, aniruddh302004@gmail.com"), true);
  assert.equal(isAllowedEmailValue("other@example.com", "owner@example.com, aniruddh302004@gmail.com"), false);
});

test("admin identity is an exact configured user-id match", () => {
  assert.equal(isAdminUserId("aj05767625", "aj05767625"), true);
  assert.equal(isAdminUserId("other-user", "aj05767625"), false);
  assert.equal(isAdminUserId("aj05767625", ""), false);
});

test("admin email matching is case-insensitive and exact", () => {
  assert.equal(isAdminEmail(" AJ05767625@GMAIL.COM ", "aj05767625@gmail.com"), true);
  assert.equal(isAdminEmail("aniruddh302004@gmail.com", "aj05767625@gmail.com"), false);
  assert.equal(isAdminEmail("aj05767625@gmail.com", ""), false);
});

test("the configured admin email is included in the effective allowlist", async () => {
  const allowlist = await readFile(new URL("../lib/auth/allowlist.ts", import.meta.url), "utf8");
  assert.match(allowlist, /process\.env\.ADMIN_EMAIL \|\| "aj05767625@gmail\.com"/);
  assert.equal(isAllowedEmailValue("AJ05767625@GMAIL.COM", "aj05767625@gmail.com"), true);
});

test("Google sign-in returns through the existing allowlist callback", async () => {
  const login = await readFile(new URL("../components/auth/login-form.tsx", import.meta.url), "utf8");
  assert.match(login, /signInWithOAuth/);
  assert.match(login, /provider: "google"/);
  assert.match(login, /\/auth\/callback/);
});

test("an empty allowlist denies access instead of opening the app", () => {
  assert.equal(isAllowedEmailValue("owner@example.com", ""), false);
  assert.equal(isAllowedEmailValue("owner@example.com", undefined), false);
});

test("admin matching accepts the configured email or user id only", () => {
  const user = { id: "user-1", email: "Owner@Example.com" };
  assert.equal(isAdminUserValue(user, " owner@example.com ", "other-id"), true);
  assert.equal(isAdminUserValue({ ...user, email: "other@example.com" }, "owner@example.com", "user-1"), true);
  assert.equal(isAdminUserValue({ ...user, id: "user-2" }, "other@example.com", "user-1"), false);
});

test("sync payloads are bounded and never echo a client user id", () => {
  const parsed = parseSyncPayload({
    version: 1,
    userId: "attacker-id",
    data: {
      reviewRecords: { "item-1": { attempts: 1, correct: 1 } },
      profilePreferences: { dailyMinutes: 10 },
      pronunciationProgress: { "pronunciation-n5-mora": "discriminates" },
      customEntries: [{ id: "custom-1", writtenForm: "猫", meaning: "cat" }],
      bookNotes: { "genki-i:38": "Check this page." },
    },
  });

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, {
    version: 1,
    data: {
      reviewRecords: { "item-1": { attempts: 1, correct: 1 } },
      profilePreferences: { dailyMinutes: 10 },
      pronunciationProgress: { "pronunciation-n5-mora": "discriminates" },
      customEntries: [{ id: "custom-1", writtenForm: "猫", meaning: "cat" }],
      bookNotes: { "genki-i:38": "Check this page." },
    },
  });
  assert.equal("userId" in parsed.value, false);
});

test("sync payloads reject oversized collections", () => {
  const reviewRecords = Object.fromEntries(Array.from({ length: 501 }, (_, index) => [`item-${index}`, { attempts: 1 }]));
  const parsed = parseSyncPayload({ version: 1, data: { reviewRecords } });

  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /too many reviewRecords/);
});

test("sync snapshots merge state without trusting client identity", () => {
  const merged = mergeSyncSnapshots(
    { version: 1, data: { reviewRecords: { "item-1": { attempts: 1 } }, savedSentences: ["old"], customEntries: [{ id: "custom-1" }], bookNotes: { "genki-i:38": "old" }, studyStats: { xp: 4 } } },
    { version: 1, data: { userId: "attacker-id", reviewRecords: { "item-2": { attempts: 2 } }, savedSentences: ["old", "new"], customEntries: [{ id: "custom-2" }], bookNotes: { "genki-i:40": "new" }, studyStats: { xp: 8 } } },
  );

  assert.deepEqual(merged, { version: 1, data: { reviewRecords: { "item-1": { attempts: 1 }, "item-2": { attempts: 2 } }, savedSentences: ["old", "new"], customEntries: [{ id: "custom-1" }, { id: "custom-2" }], bookNotes: { "genki-i:38": "old", "genki-i:40": "new" }, studyStats: { xp: 8 } } });
  assert.equal("userId" in merged.data, false);
});
