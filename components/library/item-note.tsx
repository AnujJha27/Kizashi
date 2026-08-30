"use client";

import { useEffect, useState } from "react";

import { readNote, writeNote } from "@/lib/session";

export function ItemNote({ itemId }: Readonly<{ itemId: string }>) {
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => setBody(readNote(itemId)), [itemId]);

  const save = () => {
    writeNote(itemId, body);
    window.dispatchEvent(new Event("michi-notes-updated"));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  };

  return <details className="mt-4 border-t border-white/10 pt-3"><summary className="cursor-pointer text-xs text-[#9297a1] hover:text-[#e5b85c]">Personal note</summary><textarea value={body} onChange={(event) => { setBody(event.target.value); setSaved(false); }} placeholder="A useful association, contrast, or reminder…" rows={3} className="mt-3 w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/75 px-3 py-2 text-sm text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" /><button type="button" onClick={save} className="mt-2 rounded-lg border border-[#5d3936] px-3 py-2 text-xs font-semibold text-[#e5b85c] hover:border-[#e34a3f]">{saved ? "Saved" : "Save note"}</button></details>;
}
