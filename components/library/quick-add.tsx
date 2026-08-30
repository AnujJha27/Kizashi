"use client";

import { useEffect, useState, type FormEvent } from "react";

import Link from "next/link";

import { canonicalId, importPersonalEntries } from "@/lib/personal-import.js";
import { readCustomEntries, writeCustomEntries, writeCustomEntry, type CustomEntry } from "@/lib/session";
import type { VocabularyItem } from "@/lib/types";

export function QuickAdd({ canonicalItems }: Readonly<{ canonicalItems: VocabularyItem[] }>) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<CustomEntry[]>([]);
  const [form, setForm] = useState({ writtenForm: "", reading: "", meaning: "", sentence: "", sourceLabel: "", lesson: "", page: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      setEntries(readCustomEntries());
      setOpen(new URLSearchParams(window.location.search).get("add") === "1");
    } catch {
      setEntries([]);
    }
  }, []);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const canonicalItemId = canonicalId(form.writtenForm, form.reading, canonicalItems);
    const next = writeCustomEntry({ ...form, ...(canonicalItemId ? { canonicalItemId } : {}) });
    setEntries(next);
    setForm({ writtenForm: "", reading: "", meaning: "", sentence: "", sourceLabel: "", lesson: "", page: "" });
    setMessage("Saved to your local shelf.");
  };

  const importList = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = importPersonalEntries(await file.text(), canonicalItems);
      if (result.entries.length) setEntries(writeCustomEntries(result.entries));
      const mapped = result.entries.filter((entry: CustomEntry) => entry.canonicalItemId).length;
      setMessage(`${result.entries.length} imported · ${mapped} mapped to the canonical library${result.errors.length ? ` · ${result.errors.length} skipped` : ""}.`);
    } catch {
      setMessage("That list could not be imported.");
    }
  };

  return <section className="mb-7 rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-4"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Personal shelf</p><p className="mt-1 text-sm text-[#9297a1]">{entries.length} custom entr{entries.length === 1 ? "y" : "ies"}</p></div><div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Import CSV/JSON<input type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" onChange={(event) => { void importList(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">{open ? "Close" : "Add Japanese"}</button></div></div>{message ? <p className="mt-3 text-xs text-[#e5b85c]" role="status">{message}</p> : null}{open ? <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-[#9297a1]">Japanese<input required value={form.writtenForm} onChange={(event) => update("writtenForm", event.target.value)} placeholder="言葉" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Reading<input value={form.reading} onChange={(event) => update("reading", event.target.value)} placeholder="ことば" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Meaning<input required value={form.meaning} onChange={(event) => update("meaning", event.target.value)} placeholder="meaning" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Sentence<input value={form.sentence} onChange={(event) => update("sentence", event.target.value)} placeholder="A sentence to remember" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Textbook/source<input value={form.sourceLabel} onChange={(event) => update("sourceLabel", event.target.value)} placeholder="Genki I" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Lesson/chapter<input value={form.lesson} onChange={(event) => update("lesson", event.target.value)} placeholder="3" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Page<input value={form.page} onChange={(event) => update("page", event.target.value)} placeholder="42" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><button type="submit" className="w-fit rounded-lg border border-[#5d3936] px-3 py-2 text-xs font-semibold text-[#e5b85c] hover:border-[#e34a3f]">Save to shelf</button></form> : null}{entries.length ? <div className="mt-5 space-y-2">{entries.slice(0, 4).map((entry) => <div key={entry.id} className="rounded-lg bg-[#101b2b]/65 px-3 py-2"><p className="jp-serif text-lg text-[#e5b85c]">{entry.writtenForm}{entry.reading ? ` · ${entry.reading}` : ""}</p><p className="text-xs text-[#9297a1]">{entry.meaning}{entry.sentence ? ` · ${entry.sentence}` : ""}{entry.sourceLabel ? ` · ${entry.sourceLabel}${entry.lesson ? ` · L${entry.lesson}` : ""}${entry.page ? ` · p.${entry.page}` : ""}` : ""}</p>{entry.canonicalItemId ? <Link href={`/entry/${entry.canonicalItemId}`} className="mt-1 inline-block text-[11px] text-[#e5b85c] hover:text-[#f1cf7c]">Open canonical entry →</Link> : null}</div>)}</div> : null}</section>;
}
