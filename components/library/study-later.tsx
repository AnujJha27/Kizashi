"use client";

import { useEffect, useState } from "react";

import { readStudyLaterIds, toggleStudyLater } from "@/lib/session";

export function StudyLaterButton({ itemId }: Readonly<{ itemId: string }>) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setSaved(readStudyLaterIds().includes(itemId));
    refresh();
    window.addEventListener("michi-study-later-updated", refresh);
    return () => window.removeEventListener("michi-study-later-updated", refresh);
  }, [itemId]);

  const toggle = () => {
    setSaved(toggleStudyLater(itemId));
    window.dispatchEvent(new Event("michi-study-later-updated"));
  };

  return <button type="button" onClick={toggle} aria-pressed={saved} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${saved ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652] text-[#9297a1] hover:border-[#e5b85c] hover:text-[#f1cf7c]"}`}>{saved ? "Saved for later" : "Study later"}</button>;
}
