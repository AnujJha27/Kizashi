import test from "node:test";
import assert from "node:assert/strict";

import { importPersonalEntries } from "../lib/personal-import.js";

test("imports personal CSV rows and maps exact canonical vocabulary", () => {
  const csv = [
    "Japanese,Reading,Meaning,Sentence,Source,Lesson,Page",
    '駅,えき,station,駅へ行きます。,Genki I,3,42',
    '新語,,new word,,,',
  ].join("\n");
  const result = importPersonalEntries(csv, [
    { id: "vocab-eki", category: "vocabulary", writtenForm: "駅", reading: "えき" },
  ]);

  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.entries, [
    {
      id: "personal-genki-i-駅-えき-3-42",
      writtenForm: "駅",
      reading: "えき",
      meaning: "station",
      sentence: "駅へ行きます。",
      sourceLabel: "Genki I",
      lesson: "3",
      page: "42",
      canonicalItemId: "vocab-eki",
    },
    {
      id: "personal-list-新語--",
      writtenForm: "新語",
      reading: "",
      meaning: "new word",
      sentence: "",
      sourceLabel: "",
      lesson: "",
      page: "",
    },
  ]);
});
