import test from "node:test";
import assert from "node:assert/strict";

import { isAllowedEmailValue } from "../lib/auth/allowlist-core.js";
import { mergeSyncSnapshots, parseSyncPayload } from "../lib/supabase/sync-core.js";

test("allowlist matching is case-insensitive and trims both addresses", () => {
  assert.equal(isAllowedEmailValue("  Owner@Example.com ", "owner@example.com"), true);
  assert.equal(isAllowedEmailValue("other@example.com", "owner@example.com"), false);
});

test("an empty allowlist denies access instead of opening the app", () => {
  assert.equal(isAllowedEmailValue("owner@example.com", ""), false);
  assert.equal(isAllowedEmailValue("owner@example.com", undefined), false);
});

test("sync payloads are bounded and never echo a client user id", () => {
  const parsed = parseSyncPayload({
    version: 1,
    userId: "attacker-id",
    data: {
      reviewRecords: { "item-1": { attempts: 1, correct: 1 } },
      profilePreferences: { dailyMinutes: 10 },
    },
  });

  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, {
    version: 1,
    data: {
      reviewRecords: { "item-1": { attempts: 1, correct: 1 } },
      profilePreferences: { dailyMinutes: 10 },
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
    { version: 1, data: { reviewRecords: { "item-1": { attempts: 1 } }, savedSentences: ["old"], studyStats: { xp: 4 } } },
    { version: 1, data: { userId: "attacker-id", reviewRecords: { "item-2": { attempts: 2 } }, savedSentences: ["old", "new"], studyStats: { xp: 8 } } },
  );

  assert.deepEqual(merged, { version: 1, data: { reviewRecords: { "item-1": { attempts: 1 }, "item-2": { attempts: 2 } }, savedSentences: ["old", "new"], studyStats: { xp: 8 } } });
  assert.equal("userId" in merged.data, false);
});
