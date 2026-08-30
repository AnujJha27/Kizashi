"use client";

import { useEffect, useState } from "react";

import { readSavedSentences, toggleSavedSentence } from "@/lib/session";

export function SaveSentence({ sourceItemId, japanese, translation }: Readonly<{ sourceItemId: string; japanese: string; translation: string }>) {
  const id = `${sourceItemId}:${japanese}`;
  const [saved, setSaved] = useState(false);

  useEffect(() => setSaved(readSavedSentences().some((entry) => entry.id === id)), [id]);

  return <button type="button" onClick={() => { setSaved(toggleSavedSentence({ id, sourceItemId, japanese, translation })); window.dispatchEvent(new Event("michi-saved-sentences-updated")); }} className="mt-2 text-xs font-semibold text-[#9297a1] hover:text-[#e5b85c]" aria-pressed={saved}>{saved ? "★ Saved sentence" : "☆ Save sentence"}</button>;
}
