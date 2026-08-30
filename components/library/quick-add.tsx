"use client";

import { useEffect, useState, type FormEvent } from "react";

import { readCustomEntries, writeCustomEntry, type CustomEntry } from "@/lib/session";

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<CustomEntry[]>([]);
  const [form, setForm] = useState({ writtenForm: "", reading: "", meaning: "", sentence: "" });

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
    const next = writeCustomEntry(form);
    setEntries(next);
    window.dispatchEvent(new Event("michi-custom-entries-updated"));
    setForm({ writtenForm: "", reading: "", meaning: "", sentence: "" });
  };

  return <section className="mb-7 rounded-xl border border-[#3f3427] bg-[#211d18]/65 p-4"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Personal shelf</p><p className="mt-1 text-sm text-[#9297a1]">{entries.length} custom entr{entries.length === 1 ? "y" : "ies"}</p></div><button type="button" onClick={() => setOpen((value) => !value)} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">{open ? "Close" : "Add Japanese"}</button></div>{open ? <form onSubmit={save} className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-[#9297a1]">Japanese<input required value={form.writtenForm} onChange={(event) => update("writtenForm", event.target.value)} placeholder="言葉" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Reading<input value={form.reading} onChange={(event) => update("reading", event.target.value)} placeholder="ことば" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Meaning<input required value={form.meaning} onChange={(event) => update("meaning", event.target.value)} placeholder="meaning" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><label className="text-xs text-[#9297a1]">Sentence<input value={form.sentence} onChange={(event) => update("sentence", event.target.value)} placeholder="A sentence to remember" className="mt-1 w-full rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2]" /></label><button type="submit" className="w-fit rounded-lg border border-[#5d3936] px-3 py-2 text-xs font-semibold text-[#e5b85c] hover:border-[#e34a3f]">Save to shelf</button></form> : null}{entries.length ? <div className="mt-5 space-y-2">{entries.slice(0, 4).map((entry) => <div key={entry.id} className="rounded-lg bg-[#101b2b]/65 px-3 py-2"><p className="jp-serif text-lg text-[#e5b85c]">{entry.writtenForm}{entry.reading ? ` · ${entry.reading}` : ""}</p><p className="text-xs text-[#9297a1]">{entry.meaning}{entry.sentence ? ` · ${entry.sentence}` : ""}</p></div>)}</div> : null}</section>;
}
