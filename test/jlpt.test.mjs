import test from "node:test";
import assert from "node:assert/strict";

import { chooseReadinessPriority } from "../lib/jlpt-core.js";

test("prioritizes a below-minimum listening section before general skill weakness", () => {
  const skills = [
    { skillType: "vocabulary", coverage: 0.1, recentAccuracy: 0.2, retention: 0.1 },
    { skillType: "listening", coverage: 0.8, recentAccuracy: 0.8, retention: 0.8 },
  ];
  const sections = [{ id: "listening", status: "below-minimum" }];
  assert.equal(chooseReadinessPriority(skills, sections).skillType, "listening");
});

test("uses general skill weakness when every section is above minimum", () => {
  const skills = [
    { skillType: "vocabulary", coverage: 0.2, recentAccuracy: 0.2, retention: 0.2 },
    { skillType: "listening", coverage: 0.8, recentAccuracy: 0.8, retention: 0.8 },
  ];
  const sections = [{ id: "listening", status: "above-minimum" }];
  assert.equal(chooseReadinessPriority(skills, sections).skillType, "vocabulary");
});
