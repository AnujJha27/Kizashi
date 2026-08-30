"use client";

import { useState } from "react";

import { normalizeAnswer } from "@/lib/mastery";
import type { KanjiItem, VocabularyItem } from "@/lib/types";

export function TypedRecall({ item, onReveal }: Readonly<{ item: VocabularyItem | KanjiItem; onReveal: () => void }>) {
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const answers = item.category === "vocabulary" ? item.meanings : [...item.kunyomi, ...item.onyomi, ...item.meanings];
  const correct = answers.some((answer) => normalizeAnswer(answer.toLowerCase()) === normalizeAnswer(value.toLowerCase()));

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    setChecked(true);
    onReveal();
  };

  return <form onSubmit={submit} className="mt-7"><label className="block text-sm text-[#9297a1]">{item.category === "vocabulary" ? "Type the meaning" : "Type a reading or meaning"}<input autoComplete="off" value={value} onChange={(event) => { setValue(event.target.value); setChecked(false); }} placeholder={item.category === "vocabulary" ? "English meaning" : "かな, 音読み, or English meaning"} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /></label><button type="submit" className="mt-3 rounded-xl border border-[#5d3936] px-4 py-3 text-sm font-semibold text-[#e5b85c] hover:border-[#e34a3f]">Check recall</button>{checked ? <p className={`mt-2 text-xs ${correct ? "text-[#8bcca6]" : "text-[#ef675d]"}`} role="status">{correct ? "Nice recall." : "Compare with the answer below."}</p> : null}</form>;
}
