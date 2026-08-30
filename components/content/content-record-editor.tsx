"use client";

import { useEffect, useMemo, useState } from "react";

import { getContentReviewStatus } from "@/lib/content-validation";
import type { LessonContentItem } from "@/lib/curriculum";
import { contentSources } from "@/lib/jlpt";
import type { ContentSource, N5Module } from "@/lib/types";

export type EditableKind = LessonContentItem["category"] | "grammarContrast" | "lesson";
type DraftRecord = Record<string, unknown>;

const kinds: { id: EditableKind; label: string; key: string }[] = [
  { id: "vocabulary", label: "Vocabulary", key: "vocabulary" },
  { id: "kanji", label: "Kanji", key: "kanji" },
  { id: "grammar", label: "Grammar", key: "grammar" },
  { id: "reading", label: "Reading", key: "readings" },
  { id: "listening", label: "Listening", key: "listening" },
  { id: "grammarContrast", label: "Grammar contrast", key: "grammarContrasts" },
  { id: "lesson", label: "Lesson", key: "lessons" },
];

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown, fallback = 1) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function sourceRecordEntries(record: DraftRecord) {
  if (Array.isArray(record.sourceRecords)) {
    return record.sourceRecords
      .filter((entry): entry is DraftRecord => typeof entry === "object" && entry !== null && !Array.isArray(entry) && typeof entry.record === "object" && entry.record !== null && !Array.isArray(entry.record))
      .map((entry) => ({ sourceId: stringValue(entry.sourceId), record: entry.record as DraftRecord }));
  }
  return typeof record.sourceRecord === "object" && record.sourceRecord !== null && !Array.isArray(record.sourceRecord)
    ? [{ sourceId: stringList(record.sourceIds)[0] ?? "source-review", record: record.sourceRecord as DraftRecord }]
    : [];
}

function sourceRecordFields(record: DraftRecord) {
  return Object.entries(record).flatMap(([key, value]) => {
    if (key === "cells" || key === "raw" || value === null || value === undefined) return [];
    if (typeof value === "string" || typeof value === "number") return value === "" ? [] : [{ key, value: String(value) }];
    if (Array.isArray(value)) {
      const values = value.filter((entry): entry is string | number => typeof entry === "string" || typeof entry === "number");
      return values.length ? [{ key, value: values.join(" · ") }] : [];
    }
    return [];
  }).slice(0, 10);
}

function sourceFieldLabel(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function SourceEvidence({ record, sources }: Readonly<{ record: DraftRecord; sources: ContentSource[] }>) {
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const sourceIds = stringList(record.sourceIds);
  const fieldSourceEntries = typeof record.fieldSourceIds === "object" && record.fieldSourceIds !== null && !Array.isArray(record.fieldSourceIds)
    ? Object.entries(record.fieldSourceIds).flatMap(([field, values]) => { const ids = stringList(values); return ids.length ? [{ field, ids }] : []; })
    : [];
  [...sourceIds, ...fieldSourceEntries.flatMap((entry) => entry.ids)].forEach((sourceId) => {
    if (sourceById.has(sourceId)) return;
    const parent = sources.find((source) => sourceId.startsWith(`${source.id}-`));
    if (parent) sourceById.set(sourceId, parent);
  });
  const snapshots = sourceRecordEntries(record);
  if (!sourceIds.length && !fieldSourceEntries.length && !snapshots.length) return null;
  const pending = getContentReviewStatus(record) === "pending";
  return <details open={pending} className="rounded-lg border border-[#5d4c2c] bg-[#211d18]/45 p-3"><summary className="cursor-pointer list-none text-xs font-semibold text-[#e5b85c]">Source evidence · {sourceIds.length || fieldSourceEntries.length || snapshots.length} attached</summary><div className="mt-3 space-y-3"><div className="grid gap-2 sm:grid-cols-2">{sourceIds.map((sourceId) => { const source = sourceById.get(sourceId); return <div key={sourceId} className="rounded-md border border-white/10 bg-[#101b2b]/65 p-3"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-[#f5f5f2]">{source?.name ?? sourceId}</p><span className="text-[10px] uppercase tracking-[.1em] text-[#e5b85c]">{source?.type ?? "source"}</span></div><p className="mt-1 text-[11px] leading-5 text-[#9297a1]">{source?.license ?? source?.notes ?? "Check this source before approval."}</p>{source?.localFilename || source?.retrievedAt ? <p className="mt-2 truncate font-mono text-[10px] text-[#676c75]">{source.localFilename ?? "cached source"}{source.retrievedAt ? ` · ${source.retrievedAt.slice(0, 10)}` : ""}</p> : null}</div>; })}</div>{fieldSourceEntries.length ? <div className="rounded-md border border-[#4b3a29] bg-[#211d18]/35 p-3"><p className="text-[10px] uppercase tracking-[.1em] text-[#e5b85c]">Field provenance</p><dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-2">{fieldSourceEntries.map((entry) => <div key={entry.field} className="min-w-0"><dt className="text-[10px] text-[#676c75]">{sourceFieldLabel(entry.field)}</dt><dd className="truncate text-xs text-[#c3c7ce]" title={entry.ids.join(" · ")}>{entry.ids.map((sourceId) => sourceById.get(sourceId)?.name ?? sourceId).join(" · ")}</dd></div>)}</dl></div> : null}{snapshots.length ? <div className="space-y-2">{snapshots.map((snapshot, index) => { const source = sourceById.get(snapshot.sourceId); const fields = sourceRecordFields(snapshot.record); return <div key={`${snapshot.sourceId}-${index}`} className="rounded-md border border-white/10 bg-[#101b2b]/65 p-3"><p className="text-xs font-semibold text-[#f5f5f2]">{source?.name ?? snapshot.sourceId} snapshot</p>{fields.length ? <dl className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">{fields.map((field) => <div key={`${field.key}-${field.value}`} className="min-w-0"><dt className="text-[10px] uppercase tracking-[.1em] text-[#676c75]">{sourceFieldLabel(field.key)}</dt><dd className="truncate text-xs text-[#c3c7ce]" title={field.value}>{field.value}</dd></div>)}</dl> : <p className="mt-2 text-[11px] text-[#9297a1]">No compact fields available; inspect the source artifact listed above.</p>}</div>; })}</div> : !fieldSourceEntries.length ? <p className="text-[11px] text-[#9297a1]">This record has provenance attached but no saved source snapshot.</p> : null}</div></details>;
}

function recordList(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is DraftRecord => typeof entry === "object" && entry !== null && !Array.isArray(entry)) : [];
}

function parseDraft(raw: string, fallback: N5Module) {
  try {
    const value = JSON.parse(raw) as unknown;
    return typeof value === "object" && value !== null && !Array.isArray(value) ? value as N5Module : fallback;
  } catch {
    return fallback;
  }
}

function recordsFor(module: N5Module, kind: EditableKind) {
  if (kind === "lesson") {
    return (module.course?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []) as unknown as DraftRecord[];
  }
  const key = kinds.find((entry) => entry.id === kind)?.key ?? kind;
  const value = (module as unknown as DraftRecord)[key];
  return Array.isArray(value) ? value.filter((entry): entry is DraftRecord => typeof entry === "object" && entry !== null && !Array.isArray(entry)) : [];
}

function replaceRecord(raw: string, kind: EditableKind, id: string, next: DraftRecord) {
  const value = JSON.parse(raw) as DraftRecord;
  if (kind === "lesson") {
    const course = value.course as DraftRecord | undefined;
    const chapters = Array.isArray(course?.chapters) ? course.chapters : [];
    for (const chapter of chapters) {
      if (typeof chapter !== "object" || chapter === null || !Array.isArray((chapter as DraftRecord).lessons)) continue;
      const lessons = (chapter as DraftRecord).lessons as unknown[];
      const index = lessons.findIndex((lesson) => typeof lesson === "object" && lesson !== null && (lesson as DraftRecord).id === id);
      if (index >= 0) {
        lessons[index] = next;
        return JSON.stringify(value, null, 2);
      }
    }
    throw new Error("That lesson is no longer in the draft.");
  }
  const key = kinds.find((entry) => entry.id === kind)?.key ?? kind;
  const records = value[key];
  if (!Array.isArray(records)) throw new Error(`The package has no ${key} array.`);
  const index = records.findIndex((record) => typeof record === "object" && record !== null && (record as DraftRecord).id === id);
  if (index < 0) throw new Error("That record is no longer in the draft.");
  records[index] = next;
  return JSON.stringify(value, null, 2);
}

function assignRecordToLesson(raw: string, itemId: string, lessonId: string) {
  const value = JSON.parse(raw) as DraftRecord;
  const course = value.course as DraftRecord | undefined;
  const chapters = Array.isArray(course?.chapters) ? course.chapters : [];
  for (const chapter of chapters) {
    if (typeof chapter !== "object" || chapter === null || !Array.isArray((chapter as DraftRecord).lessons)) continue;
    for (const lesson of (chapter as DraftRecord).lessons as unknown[]) {
      if (typeof lesson !== "object" || lesson === null) continue;
      const lessonRecord = lesson as DraftRecord;
      const itemIds = stringList(lessonRecord.itemIds).filter((id) => id !== itemId);
      const isTarget = stringValue(lessonRecord.id) === lessonId || (!lessonId && stringValue(lessonRecord.id) === "lesson-openjlpt-review");
      lessonRecord.itemIds = isTarget ? [...itemIds, itemId] : itemIds;
    }
  }
  return JSON.stringify(value, null, 2);
}

function recordLabel(record: DraftRecord) {
  return stringValue(record.title) || stringValue(record.writtenForm) || stringValue(record.character) || stringValue(record.pattern) || stringValue(record.id) || "Untitled record";
}

function Input({ label, value, onChange, type = "text", hint }: Readonly<{ label: string; value: string | number; onChange: (value: string) => void; type?: "text" | "number"; hint?: string }>) {
  return <label className="block text-xs text-[#a8adb7]"><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]" />{hint ? <span className="mt-1 block text-[11px] text-[#676c75]">{hint}</span> : null}</label>;
}

function TextArea({ label, value, onChange, rows = 3, hint }: Readonly<{ label: string; value: string; onChange: (value: string) => void; rows?: number; hint?: string }>) {
  return <label className="block text-xs text-[#a8adb7]"><span>{label}</span><textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full resize-y rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm leading-6 text-[#f5f5f2] outline-none focus:border-[#e5b85c]" />{hint ? <span className="mt-1 block text-[11px] text-[#676c75]">{hint}</span> : null}</label>;
}

function Select({ label, value, options, onChange }: Readonly<{ label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }>) {
  return <label className="block text-xs text-[#a8adb7]"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="">Not set</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function ListField({ label, values, onChange, hint }: Readonly<{ label: string; values: string[]; onChange: (values: string[]) => void; hint?: string }>) {
  return <TextArea label={label} value={values.join("\n")} onChange={(value) => onChange(value.split("\n").map((entry) => entry.trim()).filter(Boolean))} rows={3} hint={hint ?? "One entry per line."} />;
}

function ExamplesField({ values, onChange }: Readonly<{ values: DraftRecord[]; onChange: (values: DraftRecord[]) => void }>) {
  const examples = values.length ? values : [{ japanese: "", translation: "" }];
  const update = (index: number, key: string, value: string) => onChange(examples.map((example, exampleIndex) => exampleIndex === index ? { ...example, [key]: value } : example));
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-xs text-[#a8adb7]">Example sentences</p><button type="button" onClick={() => onChange([...examples, { japanese: "", translation: "" }])} className="rounded-lg border border-[#3f4652] px-3 py-1.5 text-xs text-[#e5b85c] hover:border-[#e5b85c]">Add example</button></div>{examples.map((example, index) => <div key={index} className="rounded-lg border border-white/10 bg-[#101b2b]/60 p-3"><div className="grid gap-3 sm:grid-cols-2"><Input label={`Japanese ${index + 1}`} value={stringValue(example.japanese)} onChange={(value) => update(index, "japanese", value)} /><Input label={`Translation ${index + 1}`} value={stringValue(example.translation)} onChange={(value) => update(index, "translation", value)} /></div><div className="mt-3 flex items-end gap-3"><div className="flex-1"><Input label="Note (optional)" value={stringValue(example.note)} onChange={(value) => update(index, "note", value)} /></div>{examples.length > 1 ? <button type="button" onClick={() => onChange(examples.filter((_, exampleIndex) => exampleIndex !== index))} className="rounded-lg border border-[#713b37] px-3 py-2.5 text-xs text-[#ef675d]">Remove</button> : null}</div></div>)}</div>;
}

function UsefulWordsField({ values, onChange }: Readonly<{ values: DraftRecord[]; onChange: (values: DraftRecord[]) => void }>) {
  const words = values.length ? values : [{ word: "", reading: "", meaning: "" }];
  const update = (index: number, key: string, value: string) => onChange(words.map((word, wordIndex) => wordIndex === index ? { ...word, [key]: value } : word));
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-xs text-[#a8adb7]">Useful words</p><button type="button" onClick={() => onChange([...words, { word: "", reading: "", meaning: "" }])} className="rounded-lg border border-[#3f4652] px-3 py-1.5 text-xs text-[#e5b85c] hover:border-[#e5b85c]">Add word</button></div>{words.map((word, index) => <div key={index} className="grid gap-3 rounded-lg border border-white/10 bg-[#101b2b]/60 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"><Input label="Word" value={stringValue(word.word)} onChange={(value) => update(index, "word", value)} /><Input label="Reading" value={stringValue(word.reading)} onChange={(value) => update(index, "reading", value)} /><Input label="Meaning" value={stringValue(word.meaning)} onChange={(value) => update(index, "meaning", value)} />{words.length > 1 ? <button type="button" onClick={() => onChange(words.filter((_, wordIndex) => wordIndex !== index))} className="self-end rounded-lg border border-[#713b37] px-3 py-2.5 text-xs text-[#ef675d]">Remove</button> : null}</div>)}</div>;
}

function ReadingQuestionsField({ values, onChange }: Readonly<{ values: DraftRecord[]; onChange: (values: DraftRecord[]) => void }>) {
  const questions = values.length ? values : [{ prompt: "", options: ["", ""], correctAnswer: 0, questionType: "short passage detail", explanation: "" }];
  const update = (index: number, key: string, value: unknown) => onChange(questions.map((question, questionIndex) => questionIndex === index ? { ...question, [key]: value } : question));
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-xs text-[#a8adb7]">Reading questions</p><button type="button" onClick={() => onChange([...questions, { prompt: "", options: ["", ""], correctAnswer: 0, questionType: "short passage detail", explanation: "" }])} className="rounded-lg border border-[#3f4652] px-3 py-1.5 text-xs text-[#e5b85c] hover:border-[#e5b85c]">Add question</button></div>{questions.map((question, index) => { const options = stringList(question.options); return <div key={index} className="space-y-3 rounded-lg border border-white/10 bg-[#101b2b]/60 p-3"><div className="grid gap-3 sm:grid-cols-2"><TextArea label={`Prompt ${index + 1}`} value={stringValue(question.prompt)} onChange={(value) => update(index, "prompt", value)} rows={2} /><ListField label="Options" values={options} onChange={(value) => update(index, "options", value)} /></div><div className="grid gap-3 sm:grid-cols-3"><Input label="Question type" value={stringValue(question.questionType)} onChange={(value) => update(index, "questionType", value)} /><Select label="Correct option" value={String(numberValue(question.correctAnswer, 0))} options={options.map((option, optionIndex) => ({ value: String(optionIndex), label: `${optionIndex + 1}. ${option || "Empty option"}` }))} onChange={(value) => update(index, "correctAnswer", Number(value))} /><Input label="Explanation" value={stringValue(question.explanation)} onChange={(value) => update(index, "explanation", value)} /></div>{questions.length > 1 ? <button type="button" onClick={() => onChange(questions.filter((_, questionIndex) => questionIndex !== index))} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs text-[#ef675d]">Remove question</button> : null}</div>; })}</div>;
}

function ListeningQuestionsField({ values, onChange }: Readonly<{ values: DraftRecord[]; onChange: (values: DraftRecord[]) => void }>) {
  const questions = values.length ? values : [{ prompt: "", answers: ["", ""], correctAnswer: 0, questionType: "key point", explanation: "" }];
  const update = (index: number, key: string, value: unknown) => onChange(questions.map((question, questionIndex) => questionIndex === index ? { ...question, [key]: value } : question));
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-xs text-[#a8adb7]">Listening questions</p><button type="button" onClick={() => onChange([...questions, { prompt: "", answers: ["", ""], correctAnswer: 0, questionType: "key point", explanation: "" }])} className="rounded-lg border border-[#3f4652] px-3 py-1.5 text-xs text-[#e5b85c] hover:border-[#e5b85c]">Add question</button></div>{questions.map((question, index) => { const answers = stringList(question.answers); return <div key={index} className="space-y-3 rounded-lg border border-white/10 bg-[#101b2b]/60 p-3"><div className="grid gap-3 sm:grid-cols-2"><TextArea label={`Prompt ${index + 1}`} value={stringValue(question.prompt)} onChange={(value) => update(index, "prompt", value)} rows={2} /><ListField label="Answers" values={answers} onChange={(value) => update(index, "answers", value)} /></div><div className="grid gap-3 sm:grid-cols-3"><Input label="Question type" value={stringValue(question.questionType)} onChange={(value) => update(index, "questionType", value)} /><Select label="Correct answer" value={String(numberValue(question.correctAnswer, 0))} options={answers.map((answer, answerIndex) => ({ value: String(answerIndex), label: `${answerIndex + 1}. ${answer || "Empty answer"}` }))} onChange={(value) => update(index, "correctAnswer", Number(value))} /><Input label="Explanation" value={stringValue(question.explanation)} onChange={(value) => update(index, "explanation", value)} /></div>{questions.length > 1 ? <button type="button" onClick={() => onChange(questions.filter((_, questionIndex) => questionIndex !== index))} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs text-[#ef675d]">Remove question</button> : null}</div>; })}</div>;
}

function CommonFields({ record, update }: Readonly<{ record: DraftRecord; update: (field: string, value: unknown) => void }>) {
  const classification = typeof record.classification === "object" && record.classification !== null && !Array.isArray(record.classification) ? record.classification as DraftRecord : {};
  const updateClassification = (field: string, value: unknown) => update("classification", { ...classification, itemType: stringValue(record.category), itemId: stringValue(record.id), [field]: value, reviewedAt: stringValue(classification.reviewedAt) || new Date().toISOString() });
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input label="ID" value={stringValue(record.id)} onChange={(value) => update("id", value)} hint="Changing an ID can break lesson and question links." /><Input label="Slug" value={stringValue(record.slug)} onChange={(value) => update("slug", value)} /></div><div className="grid gap-3 sm:grid-cols-4"><Input label="Title" value={stringValue(record.title)} onChange={(value) => update("title", value)} /><Select label="JLPT level" value={stringValue(record.jlptLevel)} options={["N5", "N4", "N3", "N2", "N1"].map((level) => ({ value: level, label: level }))} onChange={(value) => update("jlptLevel", value || null)} /><Input label="Difficulty (1–5)" type="number" value={numberValue(record.difficulty)} onChange={(value) => update("difficulty", Number(value))} /><Select label="Review status" value={getContentReviewStatus(record)} options={[{ value: "pending", label: "Pending review" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]} onChange={(value) => update("reviewStatus", value || "approved")} /></div><div className="grid gap-3 sm:grid-cols-3"><Input label="Subcategory" value={stringValue(record.subcategory)} onChange={(value) => update("subcategory", value)} /><ListField label="Tags" values={stringList(record.tags)} onChange={(value) => update("tags", value)} /><ListField label="Prerequisites" values={stringList(record.prerequisiteIds)} onChange={(value) => update("prerequisiteIds", value)} /></div><ListField label="Source IDs" values={stringList(record.sourceIds)} onChange={(value) => update("sourceIds", value)} hint="Keep provenance here; one source ID per line." /><div className="rounded-lg border border-[#5d4c2c] bg-[#211d18]/35 p-3"><p className="text-xs font-semibold text-[#e5b85c]">Curriculum classification</p><p className="mt-1 text-[11px] text-[#9297a1]">Keep JLPT placement separate from dictionary facts. Imported records need a reviewed level and band before publishing.</p>{classification.conflict ? <p className="mt-2 rounded-md border border-[#713b37] bg-[#21191a]/70 px-3 py-2 text-[11px] leading-5 text-[#efc0bb]">Source levels disagree: {Object.entries(classification.sourceLevels ?? {}).map(([source, level]) => `${source}=${level}`).join(" · ")}. Resolve the evidence before approving.</p> : null}<div className="mt-3 grid gap-3 sm:grid-cols-3"><Select label="Classification level" value={stringValue(classification.level)} options={["N5", "N4", "N3", "N2", "N1"].map((level) => ({ value: level, label: level }))} onChange={(value) => updateClassification("level", value || undefined)} /><Select label="Band" value={stringValue(classification.band)} options={[{ value: "core", label: "Core" }, { value: "extended", label: "Extended" }, { value: "bridge", label: "Bridge" }]} onChange={(value) => updateClassification("band", value || undefined)} /><Select label="Confidence" value={stringValue(classification.confidence)} options={[{ value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} onChange={(value) => updateClassification("confidence", value || undefined)} /></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><ListField label="Classification evidence" values={stringList(classification.evidenceSources)} onChange={(value) => updateClassification("evidenceSources", value)} hint="Source IDs supporting the level decision." /><TextArea label="Inclusion reason" value={stringValue(classification.inclusionReason)} onChange={(value) => updateClassification("inclusionReason", value)} hint="Why this belongs in the selected band." /></div></div></div>;
}

function BaseFields({ record, update }: Readonly<{ record: DraftRecord; update: (field: string, value: unknown) => void }>) {
  return <Input label="ID" value={stringValue(record.id)} onChange={(value) => update("id", value)} hint="Changing an ID can break links." />;
}

function ItemFieldsContent({ kind, record, update }: Readonly<{ kind: EditableKind; record: DraftRecord; update: (field: string, value: unknown) => void }>) {
  if (kind === "vocabulary") return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Input label="Written form" value={stringValue(record.writtenForm)} onChange={(value) => update("writtenForm", value)} /><Input label="Reading" value={stringValue(record.reading)} onChange={(value) => update("reading", value)} /><Input label="Part of speech" value={stringValue(record.partOfSpeech)} onChange={(value) => update("partOfSpeech", value)} /></div><div className="grid gap-3 sm:grid-cols-3"><Input label="Commonness (1–5)" type="number" value={numberValue(record.commonness, 0)} onChange={(value) => update("commonness", Number(value) || undefined)} hint="Curated beginner frequency signal." /><Input label="Written frequency" type="number" value={numberValue(record.frequency, 0)} onChange={(value) => update("frequency", Number(value) || undefined)} hint="Keep the source and corpus in field provenance." /><Input label="Spoken frequency" type="number" value={numberValue(record.spokenFrequency, 0)} onChange={(value) => update("spokenFrequency", Number(value) || undefined)} hint="Optional licensed spoken corpus signal." /></div><div className="grid gap-3 sm:grid-cols-3"><ListField label="Meanings" values={stringList(record.meanings)} onChange={(value) => update("meanings", value)} /><ListField label="Collocations" values={stringList(record.collocations)} onChange={(value) => update("collocations", value)} /><ListField label="Related words" values={stringList(record.relatedWords)} onChange={(value) => update("relatedWords", value)} /></div><ListField label="Antonyms" values={stringList(record.antonyms)} onChange={(value) => update("antonyms", value)} /><TextArea label="Notes" value={stringValue(record.notes)} onChange={(value) => update("notes", value)} /><ExamplesField values={recordList(record.exampleSentences)} onChange={(value) => update("exampleSentences", value)} /></div>;
  if (kind === "kanji") return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3"><Input label="Character" value={stringValue(record.character)} onChange={(value) => update("character", value)} /><Input label="Stroke count" type="number" value={numberValue(record.strokeCount, 0)} onChange={(value) => update("strokeCount", Number(value) || undefined)} /><Input label="School grade" type="number" value={numberValue(record.grade, 0)} onChange={(value) => update("grade", Number(value) || undefined)} /></div><div className="grid gap-3 sm:grid-cols-3"><ListField label="Meanings" values={stringList(record.meanings)} onChange={(value) => update("meanings", value)} /><ListField label="On readings" values={stringList(record.onyomi)} onChange={(value) => update("onyomi", value)} /><ListField label="Kun readings" values={stringList(record.kunyomi)} onChange={(value) => update("kunyomi", value)} /></div><div className="grid gap-3 sm:grid-cols-3"><Input label="Radical" value={stringValue(record.radical)} onChange={(value) => update("radical", value)} /><ListField label="Nanori" values={stringList(record.nanori)} onChange={(value) => update("nanori", value)} /><ListField label="Components" values={stringList(record.components)} onChange={(value) => update("components", value)} /></div><TextArea label="Mnemonic" value={stringValue(record.mnemonic)} onChange={(value) => update("mnemonic", value)} /><Input label="Stroke-order reference" value={stringValue(record.strokeOrder)} onChange={(value) => update("strokeOrder", value)} /><UsefulWordsField values={recordList(record.usefulWords)} onChange={(value) => update("usefulWords", value)} /></div>;
  if (kind === "grammar") return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Input label="Pattern" value={stringValue(record.pattern)} onChange={(value) => update("pattern", value)} /><Input label="Meaning" value={stringValue(record.meaning)} onChange={(value) => update("meaning", value)} /></div><Input label="Formation" value={stringValue(record.formation)} onChange={(value) => update("formation", value)} /><TextArea label="Intuition" value={stringValue(record.intuition)} onChange={(value) => update("intuition", value)} /><div className="grid gap-3 sm:grid-cols-2"><ListField label="Usage conditions" values={stringList(record.usageConditions)} onChange={(value) => update("usageConditions", value)} /><ListField label="Common mistakes" values={stringList(record.commonMistakes)} onChange={(value) => update("commonMistakes", value)} /></div><div className="grid gap-3 sm:grid-cols-2"><ListField label="Contrast IDs" values={stringList(record.contrastIds)} onChange={(value) => update("contrastIds", value)} /><ListField label="Practice question IDs" values={stringList(record.practiceQuestionIds)} onChange={(value) => update("practiceQuestionIds", value)} /></div><ExamplesField values={recordList(record.examples)} onChange={(value) => update("examples", value)} /></div>;
  if (kind === "reading") return <div className="space-y-4"><TextArea label="Passage" value={stringValue(record.passage)} onChange={(value) => update("passage", value)} rows={7} /><TextArea label="Translation" value={stringValue(record.translation)} onChange={(value) => update("translation", value)} /><div className="grid gap-3 sm:grid-cols-2"><ListField label="Vocabulary IDs" values={stringList(record.vocabularyIds)} onChange={(value) => update("vocabularyIds", value)} /><ListField label="Grammar IDs" values={stringList(record.grammarIds)} onChange={(value) => update("grammarIds", value)} /><ListField label="Kanji IDs" values={stringList(record.kanjiIds)} onChange={(value) => update("kanjiIds", value)} /><Input label="Estimated difficulty (1–5)" type="number" value={numberValue(record.estimatedDifficulty)} onChange={(value) => update("estimatedDifficulty", Number(value))} /></div><ReadingQuestionsField values={recordList(record.questions)} onChange={(value) => update("questions", value)} /></div>;
  if (kind === "listening") return <div className="space-y-4"><TextArea label="Situation" value={stringValue(record.situation)} onChange={(value) => update("situation", value)} /><TextArea label="Transcript" value={stringValue(record.transcript)} onChange={(value) => update("transcript", value)} rows={7} /><div className="grid gap-3 sm:grid-cols-4"><Input label="Voice" value={stringValue(record.voice)} onChange={(value) => update("voice", value)} /><Input label="Speed" type="number" value={numberValue(record.speed, 0.9)} onChange={(value) => update("speed", Number(value))} /><Select label="Source type" value={stringValue(record.sourceType)} options={["recorded", "tts", "imported"].map((sourceType) => ({ value: sourceType, label: sourceType }))} onChange={(value) => update("sourceType", value)} /><Input label="Audio URL" value={stringValue(record.audioUrl)} onChange={(value) => update("audioUrl", value || null)} /></div><ListeningQuestionsField values={recordList(record.questions)} onChange={(value) => update("questions", value)} /></div>;
  if (kind === "grammarContrast") return <div className="space-y-4"><Input label="Title" value={stringValue(record.title)} onChange={(value) => update("title", value)} /><ListField label="Grammar point IDs" values={stringList(record.grammarPointIds)} onChange={(value) => update("grammarPointIds", value)} /><TextArea label="Explanation" value={stringValue(record.explanation)} onChange={(value) => update("explanation", value)} /><ListField label="Exercises" values={stringList(record.exercises)} onChange={(value) => update("exercises", value)} /><ExamplesField values={recordList(record.examples)} onChange={(value) => update("examples", value)} /></div>;
  return <div className="space-y-4"><Input label="Title" value={stringValue(record.title)} onChange={(value) => update("title", value)} /><div className="grid gap-3 sm:grid-cols-2"><Input label="Slug" value={stringValue(record.slug)} onChange={(value) => update("slug", value)} /><Input label="Subtitle" value={stringValue(record.subtitle)} onChange={(value) => update("subtitle", value)} /></div><TextArea label="Description" value={stringValue(record.description)} onChange={(value) => update("description", value)} /><Input label="Estimated minutes" type="number" value={numberValue(record.estimatedMinutes, 10)} onChange={(value) => update("estimatedMinutes", Number(value))} /><ListField label="Learning item IDs" values={stringList(record.itemIds)} onChange={(value) => update("itemIds", value)} hint="One vocabulary, kanji, grammar, reading, or listening ID per line." /></div>;
}

function ReviewActions({ record, update }: Readonly<{ record: DraftRecord; update: (field: string, value: unknown) => void }>) {
  const status = getContentReviewStatus(record);
  const isReviewRecord = status !== "approved";
  if (!isReviewRecord) return null;
  return <div className="rounded-lg border border-[#5d4c2c] bg-[#211d18]/35 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[#e5b85c]">Review decision</p><p className="mt-1 text-[11px] text-[#9297a1]">Approve to include this record in the learner pipeline.</p></div><span className={status === "rejected" ? "text-xs font-semibold text-[#ef675d]" : "text-xs font-semibold text-[#e5b85c]"}>{status}</span></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => update("reviewStatus", "approved")} className="rounded-lg bg-[#6fb98f] px-3 py-2 text-xs font-semibold text-[#0b0b0d] hover:bg-[#8bcca6]">Approve · add to pipeline</button><button type="button" disabled={status === "rejected"} onClick={() => update("reviewStatus", "rejected")} className="rounded-lg border border-[#713b37] px-3 py-2 text-xs font-semibold text-[#ef675d] enabled:hover:border-[#ef675d] disabled:cursor-not-allowed disabled:opacity-50">{status === "rejected" ? "Rejected" : "Reject"}</button></div></div>;
}

function LessonAssignment({ module, raw, record, onChange }: Readonly<{ module: N5Module; raw: string; record: DraftRecord; onChange: (raw: string) => void }>) {
  const itemId = stringValue(record.id);
  const lessons = (module.course?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []).filter((lesson) => lesson.id !== "lesson-openjlpt-review");
  const holdingLesson = (module.course?.chapters ?? []).flatMap((chapter) => chapter.lessons ?? []).find((lesson) => lesson.id === "lesson-openjlpt-review");
  const assignedLesson = [...lessons, ...(holdingLesson ? [holdingLesson] : [])].find((lesson) => lesson.itemIds.includes(itemId));
  if (!itemId || !lessons.length && !holdingLesson) return null;
  return <label className="block text-xs text-[#a8adb7]"><span>Journey lesson</span><select value={assignedLesson?.id === "lesson-openjlpt-review" ? "" : assignedLesson?.id ?? ""} onChange={(event) => { try { onChange(assignRecordToLesson(raw, itemId, event.target.value)); } catch { return; } }} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="">Review holding area</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.subtitle}</option>)}</select><span className="mt-1 block text-[11px] text-[#676c75]">Approved records export to this lesson; unassigned records stay in review.</span></label>;
}

function ItemFields(props: Readonly<{ kind: EditableKind; record: DraftRecord; update: (field: string, value: unknown) => void; sources: ContentSource[]; module: N5Module; raw: string; onAssign: (raw: string) => void }>) {
  return <div className="space-y-4"><ReviewActions record={props.record} update={props.update} />{props.kind !== "lesson" && props.kind !== "grammarContrast" ? <LessonAssignment module={props.module} raw={props.raw} record={props.record} onChange={props.onAssign} /> : null}<SourceEvidence record={props.record} sources={props.sources} /><ItemFieldsContent {...props} /></div>;
}

export function ContentRecordEditor({ raw, fallback, preferredKind, preferredId, onChange, onAdd, sources = contentSources }: Readonly<{ raw: string; fallback: N5Module; preferredKind: EditableKind; preferredId?: string; onChange: (raw: string, recordId: string) => void; onAdd: (kind: EditableKind) => void; sources?: ContentSource[] }>) {
  const module = parseDraft(raw, fallback);
  const [kind, setKind] = useState<EditableKind>(preferredKind);
  const [selectedId, setSelectedId] = useState(preferredId ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const records = useMemo(() => recordsFor(module, kind), [module, kind]);
  const visibleRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records.filter((record) => {
      const status = getContentReviewStatus(record);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!query) return true;
      return [recordLabel(record), record.id, record.writtenForm, record.character, record.pattern, record.slug].some((value) => stringValue(value).toLocaleLowerCase().includes(query));
    });
  }, [records, search, statusFilter]);
  const selected = visibleRecords.find((record) => record.id === selectedId) ?? visibleRecords[0];
  const optionRecords = selected && !visibleRecords.slice(0, 200).some((record) => record.id === selected.id) ? [selected, ...visibleRecords.slice(0, 200)] : visibleRecords.slice(0, 200);

  useEffect(() => {
    setKind(preferredKind);
    setSelectedId(preferredId ?? "");
  }, [preferredKind, preferredId]);

  useEffect(() => {
    if (selected?.id !== selectedId) setSelectedId(stringValue(selected?.id));
  }, [selected, selectedId]);

  if (!selected) return <div className="rounded-xl border border-[#713b37] bg-[#21191a]/70 p-5"><p className="eyebrow text-[#ef675d]">{records.length ? "No records match" : "No records yet"}</p><p className="mt-2 text-sm text-[#c3c7ce]">{records.length ? "Clear the filters to continue editing this content type." : "Add a starter above to begin editing this content type."}</p>{records.length ? <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-4 rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c]">Clear filters</button> : <button type="button" onClick={() => onAdd(kind)} className="mt-4 rounded-lg bg-[#e34a3f] px-3 py-2 text-xs font-semibold text-[#0b0b0d]">Add {kinds.find((entry) => entry.id === kind)?.label ?? "record"}</button>}</div>;

  const update = (field: string, value: unknown) => {
    try {
      const next = { ...selected, [field]: value };
      const nextId = stringValue(next.id) || selectedId;
      onChange(replaceRecord(raw, kind, selectedId || stringValue(selected.id), next), nextId);
    } catch {
      return;
    }
  };
  const kindLabel = kinds.find((entry) => entry.id === kind)?.label ?? "Record";
  const pendingRecord = records.find((record) => getContentReviewStatus(record) === "pending");

  return <div className="rounded-xl border border-white/10 bg-[#0d1522]/65 p-4"><div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end"><label className="block flex-1 text-xs text-[#a8adb7]"><span>Content type</span><select value={kind} onChange={(event) => { const nextKind = event.target.value as EditableKind; setKind(nextKind); setSelectedId(""); }} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]">{kinds.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {recordsFor(module, entry.id).length}</option>)}</select></label><label className="block flex-[2] text-xs text-[#a8adb7]"><span>{kindLabel} record</span><select value={stringValue(selected.id)} onChange={(event) => setSelectedId(event.target.value)} className="mt-2 w-full rounded-lg border border-[#3f4652] bg-[#0d1522]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="">Select a record</option>{optionRecords.map((record) => <option key={stringValue(record.id)} value={stringValue(record.id)}>{recordLabel(record)} · {getContentReviewStatus(record)}</option>)}</select></label><button type="button" onClick={() => onAdd(kind)} className="rounded-lg border border-[#e5b85c] px-3 py-2.5 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">New {kindLabel.toLowerCase()}</button></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><label className="block flex-1 text-xs text-[#a8adb7]"><span className="sr-only">Search records</span><input value={search} onChange={(event) => { setSearch(event.target.value); setSelectedId(""); }} placeholder="Search title, ID, word, or kanji…" className="w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /></label><select aria-label="Filter review status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setSelectedId(""); }} className="rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="all">All statuses</option><option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><button type="button" disabled={!pendingRecord} onClick={() => { if (!pendingRecord) return; setSearch(""); setStatusFilter("all"); setSelectedId(stringValue(pendingRecord.id)); }} className="rounded-lg border border-[#5d4c2c] px-3 py-2.5 text-xs font-semibold text-[#e5b85c] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">Next pending</button></div><p className="mt-2 text-[11px] text-[#676c75]">Showing {visibleRecords.length} of {records.length} records; the selector shows the first 200. Imported source records remain out of the learner path until approved.</p><div className="mt-4 space-y-5">{kind === "lesson" || kind === "grammarContrast" ? <div><p className="eyebrow">Record identity</p><div className="mt-3"><BaseFields record={selected} update={update} /></div></div> : <div><p className="eyebrow">Shared learning details</p><div className="mt-3"><CommonFields record={selected} update={update} /></div></div>}<div><p className="eyebrow">{kindLabel} details</p><div className="mt-3"><ItemFields kind={kind} record={selected} update={update} sources={sources} module={module} raw={raw} onAssign={(nextRaw) => onChange(nextRaw, selectedId || stringValue(selected.id))} /></div></div></div><p className="mt-5 border-t border-white/10 pt-4 text-xs text-[#9297a1]">Changes are kept in this draft immediately. Validate the package before saving or publishing.</p></div>;
}
