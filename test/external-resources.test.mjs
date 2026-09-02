import test from "node:test";
import assert from "node:assert/strict";

import {
  externalResources,
  getErinFamilyResource,
  getErinLessonResources,
  getExternalResourceById,
  getExternalResources,
  externalResourceToSourceLink,
  canEmbedExternalSource,
  canPlayExternalSourceMedia,
} from "../lib/external-resources-runtime.js";

test("registry filters resources and returns an empty result for missing matches", () => {
  assert.deepEqual(getExternalResources({ type: "grammar-reference" }).map((resource) => resource.sourceId), ["tae-kim"]);
  assert.deepEqual(getExternalResources({ type: "lesson" }).map((resource) => resource.id), ["erin", "irodori-practical-lessons"]);
  assert.deepEqual(getExternalResources({ itemId: "grammar-wa" }).map((resource) => resource.id), ["erin-01"]);
  assert.deepEqual(getExternalResources({ skill: "location question" }).map((resource) => resource.id), ["erin-04"]);
  assert.deepEqual(getExternalResources({ tag: "situational-japanese" }).map((resource) => resource.id), ["erin"]);
  assert.deepEqual(getExternalResources({ skill: "does-not-exist" }), []);
  assert.equal(getExternalResourceById("missing-resource"), undefined);
});

test("registry and nested resource data are immutable", () => {
  const results = getExternalResources({ type: "lesson" });
  const family = getErinFamilyResource();
  const erin = getExternalResourceById("erin-01");
  assert.ok(Object.isFrozen(results));
  assert.ok(Object.isFrozen(family.tags));
  assert.ok(Object.isFrozen(erin));
  assert.ok(Object.isFrozen(erin.targetItemIds));
  assert.ok(Object.isFrozen(erin.targetSkills));
  assert.ok(Object.isFrozen(erin.metadata));
  assert.ok(Object.isFrozen(erin.metadata.resourceTypes));
  assert.ok(Object.isFrozen(getErinFamilyResource().metadata.lessonIds));
  assert.throws(() => results.push(erin), TypeError);
  assert.throws(() => results.sort(), TypeError);
  assert.throws(() => family.tags.push("bad-tag"), TypeError);
  assert.throws(() => erin.targetItemIds.push("bad-id"), TypeError);
  assert.throws(() => erin.targetSkills.push("bad-skill"), TypeError);
  assert.throws(() => erin.metadata.resourceTypes.push("bad-type"), TypeError);
  assert.throws(() => getErinFamilyResource().metadata.lessonIds.pop(), TypeError);
  assert.throws(() => { erin.metadata.role = "changed"; }, TypeError);
});

test("all registered source families expose their role and delivery boundary", () => {
  const expected = {
    erin: ["beginner situational dialogue", "frame-or-link"],
    cejc: ["real conversational patterns", "frame-or-link"],
    csj: ["spoken-corpus exposure", "frame-or-link"],
    "common-voice": ["diverse human voices", "frame-or-link"],
    tatoeba: ["sentence-linked human audio", "frame-or-link"],
    jsut: ["controlled speech", "frame-or-link"],
    "japanese-pod101": ["polished learner listening", "frame-or-link"],
    "japanese-with-shun": ["easy-Japanese video immersion", "frame-or-link"],
    "nihongo-con-teppei": ["beginner podcast immersion", "frame-or-link"],
    "tae-kim": ["alternative grammar intuition", "reference"],
    "wikibooks-japanese": ["supplementary grammar reference", "reference"],
    "wikimedia-commons": ["dynamic human pronunciation", "dynamic"],
    "aozora-bunko": ["native reading", "dynamic"],
    tadoku: ["graded extensive-reading", "frame-or-link"],
    irodori: ["practical situational practice", "frame-or-link"],
  };

  assert.deepEqual(Object.fromEntries(getExternalResources().map((resource) => [resource.sourceId, [resource.metadata.role, resource.deliveryMode]])), expected);
});

test("existing listening sources keep original URLs and can try the private frame helper", () => {
  const expected = {
    cejc: "https://chunagon.ninjal.ac.jp/shc/",
    csj: "https://chunagon.ninjal.ac.jp/auth/login",
    "common-voice": "https://mozilladatacollective.com/datasets/cmqim4lxy00tunr07cjkcupeg",
    tatoeba: "https://tatoeba.org/en/audio/index/jpn",
    jsut: "https://sites.google.com/site/shinnosuketakamichi/publication/jsut",
    "japanese-pod101": "https://www.japanesepod101.com/lesson-library/level-1-japanese",
    "japanese-with-shun": "https://www.youtube.com/@JapanesewithShun",
    "nihongo-con-teppei": "https://teppei.nihongoconteppei.com/",
  };

  for (const [id, url] of Object.entries(expected)) {
    const resource = getExternalResourceById(id);
    assert.equal(resource.deliveryMode, "frame-or-link");
    assert.equal(resource.url, url);
  }
});

test("Erin is one shelf family with canonical lesson records and media", () => {
  assert.equal(getExternalResources().filter((resource) => resource.sourceId === "erin").length, 1);
  assert.equal(getExternalResources({ type: "lesson" }).filter((resource) => resource.sourceId === "erin").length, 1);
  const family = getErinFamilyResource();
  assert.equal(family.id, "erin");
  const lessons = getErinLessonResources();
  const expectedLessons = [
    ["erin-01", "First-meeting greetings · classroom", "greetings", ["vocab-watashi", "grammar-desu", "grammar-wa"], ["self-introduction"], "01"],
    ["erin-02", "Making requests · school", "requests", ["grammar-kudasai", "grammar-wo"], ["polite request"], "02"],
    ["erin-03", "Indicating things · home", "demonstratives", ["vocab-kore", "vocab-sore", "grammar-kore"], ["object reference"], "03"],
    ["erin-04", "Asking locations · convenience store", "locations", ["vocab-doko", "grammar-doko", "grammar-ni", "grammar-de"], ["location question"], "04"],
    ["erin-06", "Asking prices · bus", "prices", ["vocab-ikura", "vocab-en", "grammar-ka"], ["price question"], "06"],
    ["erin-08", "Ordering · fast food", "ordering food", ["vocab-gohan", "grammar-kudasai", "grammar-wo"], ["service interaction"], "08"],
  ];

  assert.deepEqual(lessons.map((lesson) => lesson.id), expectedLessons.map(([id]) => id));
  assert.deepEqual(family.metadata.lessonIds, expectedLessons.map(([id]) => id));
  for (const [id, title, context, targetItemIds, targetSkills, number] of expectedLessons) {
    const lesson = getExternalResourceById(id);
    assert.equal(lesson.sourceId, "erin");
    assert.equal(lesson.name, "Erin's Challenge");
    assert.equal(lesson.title, title);
    assert.equal(lesson.level, "N5");
    assert.equal(lesson.resourceType, "lesson");
    assert.equal(lesson.deliveryMode, "frame-or-link");
    assert.equal(lesson.url, `https://www.erin.jpf.go.jp/en/lesson/${number}/basic/`);
    assert.equal(lesson.description, "Stream the Japan Foundation video directly from its original site; scripts and controls remain available from the lesson page.");
    assert.deepEqual(lesson.targetItemIds, targetItemIds);
    assert.deepEqual(lesson.targetSkills, targetSkills);
    assert.equal(lesson.metadata.context, context);
    assert.equal(lesson.metadata.annotationStatus, "reviewed");
    assert.equal(lesson.metadata.reviewedAt, "2026-08-31");
    assert.deepEqual(lesson.metadata.resourceTypes, ["basic skit", "script PDF", "script audio MP3"]);
    assert.equal(lesson.metadata.transcriptAvailable, true);
    assert.equal(lesson.metadata.translationAvailable, true);
    assert.equal(lesson.metadata.mediaDelivery, "original-site");
    assert.equal(lesson.metadata.role, "beginner situational dialogue");
    assert.equal(lesson.metadata.rightsBehavior, "original-site-media");
    assert.equal(lesson.metadata.mediaUrl, `https://www.erin.jpf.go.jp/movie/${number}/${number}-ba_high.mp4`);
    assert.equal(lesson.metadata.posterUrl, `https://www.erin.jpf.go.jp/movie/poster/${number}-ba.jpg`);
  }
});

test("edge adapter preserves provenance and safely link-falls back reference/dynamic resources", () => {
  const family = externalResourceToSourceLink(getErinFamilyResource());
  const erinLesson = externalResourceToSourceLink(getExternalResourceById("erin-01"));
  const reference = externalResourceToSourceLink(getExternalResourceById("tae-kim-grammar"));
  const dynamic = externalResourceToSourceLink(getExternalResourceById("wikimedia-commons-lingua-libre"));
  const unsafeReference = externalResourceToSourceLink({
    ...getExternalResourceById("tae-kim-grammar"),
    metadata: {
      mediaDelivery: "original-site",
      mediaUrl: "https://example.test/reference.mp4",
      posterUrl: "https://example.test/reference.jpg",
      resourceTypes: [42],
      annotationStatus: false,
      transcriptAvailable: "yes",
    },
  });
  const unsafeDynamic = externalResourceToSourceLink({
    ...getExternalResourceById("wikimedia-commons-lingua-libre"),
    metadata: { mediaDelivery: "original-site", mediaUrl: "https://example.test/dynamic.mp4", posterUrl: "https://example.test/dynamic.jpg" },
  });
  assert.equal(family.mediaDelivery, "frame-or-link");
  assert.equal(erinLesson.mediaDelivery, "original-site");
  assert.equal(erinLesson.mediaUrl, "https://www.erin.jpf.go.jp/movie/01/01-ba_high.mp4");
  assert.equal(reference.mediaDelivery, "link-only");
  assert.equal(dynamic.mediaDelivery, "link-only");
  assert.equal(reference.mediaUrl, undefined);
  assert.equal(dynamic.mediaUrl, undefined);
  assert.equal(unsafeReference.mediaDelivery, "link-only");
  assert.equal(unsafeReference.mediaUrl, undefined);
  assert.equal(unsafeReference.posterUrl, undefined);
  assert.deepEqual(unsafeReference.resourceTypes, ["grammar-reference"]);
  assert.equal(unsafeReference.annotationStatus, undefined);
  assert.equal(unsafeReference.transcriptAvailable, undefined);
  assert.equal(unsafeDynamic.mediaDelivery, "link-only");
  assert.equal(unsafeDynamic.mediaUrl, undefined);
  assert.equal(unsafeDynamic.posterUrl, undefined);
  assert.equal(canEmbedExternalSource(family.mediaDelivery), true);
  assert.equal(canPlayExternalSourceMedia(erinLesson.mediaDelivery), true);
  assert.equal(canEmbedExternalSource(reference.mediaDelivery), false);
  assert.equal(canPlayExternalSourceMedia(reference.mediaDelivery), false);
  assert.equal(canEmbedExternalSource(dynamic.mediaDelivery), false);
  assert.equal(canPlayExternalSourceMedia(dynamic.mediaDelivery), false);
  assert.equal(canEmbedExternalSource(undefined), false);
  assert.equal(canPlayExternalSourceMedia(undefined), false);
  assert.equal(reference.resourceTypes[0], "grammar-reference");
  assert.equal(reference.annotationStatus, undefined);
  assert.equal(reference.url, "https://guidetojapanese.org/learn/grammar");
  assert.equal(reference.license, "CC BY-NC-SA 3.0");
  assert.equal(reference.attribution, "Tae Kim's Guide to Japanese");
  assert.equal(externalResources.length > getExternalResources().length, true);
});
