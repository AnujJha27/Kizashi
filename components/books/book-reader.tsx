"use client";

import { useEffect, useState } from "react";

import type { StudyBook } from "@/lib/books";

export function BookReader({ book }: Readonly<{ book: StudyBook }>) {
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [chapterId, setChapterId] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    setPdfUrl(null);
    setPdfError("");
    setPdfLoading(true);

    const loadPdf = async () => {
      try {
        const manifest = await fetch(`/api/books/${book.id}/parts`, { cache: "no-store" });
        let blob: Blob;
        if (manifest.ok) {
          const payload = await manifest.json() as { parts?: unknown };
          if (!Array.isArray(payload.parts) || !payload.parts.every((part): part is string => typeof part === "string")) throw new Error("Book parts are invalid.");
          const responses = await Promise.all(payload.parts.map((part) => fetch(part)));
          if (responses.some((response) => !response.ok)) throw new Error("Book part unavailable.");
          blob = new Blob(await Promise.all(responses.map((response) => response.blob())), { type: "application/pdf" });
        } else {
          const response = await fetch(`/api/books/${book.id}`, { cache: "no-store" });
          if (!response.ok) throw new Error("Book file unavailable.");
          blob = await response.blob();
        }
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch {
        if (!cancelled) setPdfError("This book could not be loaded.");
      } finally {
        if (!cancelled) setPdfLoading(false);
      }
    };

    void loadPdf();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [book.id]);

  useEffect(() => {
    if (typeof window !== "undefined") setNote(window.localStorage.getItem(`michi.book-review.${book.id}.1`) ?? "");
  }, [book.id]);

  const goToPage = () => {
    const next = Math.max(1, Number.parseInt(pageInput, 10) || 1);
    setPage(next);
    setPageInput(String(next));
    setChapterId(book.chapters?.find((chapter) => chapter.page === next)?.id ?? "");
    setNote(typeof window === "undefined" ? "" : window.localStorage.getItem(`michi.book-review.${book.id}.${next}`) ?? "");
    setSaved(false);
  };

  const movePage = (delta: number) => {
    const next = Math.max(1, page + delta);
    setPage(next);
    setPageInput(String(next));
    setChapterId(book.chapters?.find((chapter) => chapter.page === next)?.id ?? "");
    setNote(typeof window === "undefined" ? "" : window.localStorage.getItem(`michi.book-review.${book.id}.${next}`) ?? "");
    setSaved(false);
  };

  const chooseChapter = (id: string) => {
    const chapter = book.chapters?.find((entry) => entry.id === id);
    setChapterId(id);
    if (!chapter) return;
    setPage(chapter.page);
    setPageInput(String(chapter.page));
    setNote(typeof window === "undefined" ? "" : window.localStorage.getItem(`michi.book-review.${book.id}.${chapter.page}`) ?? "");
    setSaved(false);
  };

  const saveNote = () => {
    window.localStorage.setItem(`michi.book-review.${book.id}.${page}`, note.trim());
    setSaved(true);
  };

  return <section className="surface-panel overflow-hidden p-2 sm:p-3"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-1 pb-3 sm:px-2"><div className="flex items-center gap-2"><button type="button" onClick={() => movePage(-1)} disabled={page === 1} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">← Previous</button><button type="button" onClick={() => movePage(1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Next →</button>{pdfUrl ? <a href={`${pdfUrl}#page=${page}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Open PDF ↗</a> : null}</div><div className="flex flex-wrap items-center gap-2">{book.chapters?.length ? <label className="flex items-center gap-2 text-xs text-[#9297a1]">Chapter<select aria-label="Book chapter" value={chapterId} onChange={(event) => chooseChapter(event.target.value)} className="max-w-52 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-2 py-2 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="">Choose chapter</option>{book.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title} · p.{chapter.page}</option>)}</select></label> : null}<form onSubmit={(event) => { event.preventDefault(); goToPage(); }} className="flex items-center gap-2"><label htmlFor="book-page" className="text-xs text-[#9297a1]">Page</label><input id="book-page" type="number" min="1" value={pageInput} onChange={(event) => setPageInput(event.target.value)} onBlur={goToPage} className="w-16 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-2 py-2 text-center text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]" /><button type="submit" className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Go</button></form></div></div><div className="mt-2 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">{pdfLoading ? <div className="grid h-[68vh] min-h-[38rem] place-items-center rounded-lg bg-[#f5f5f2] text-sm text-[#676c75]">Loading private book…</div> : pdfUrl ? <iframe key={page} title={`${book.title} PDF · page ${page}`} src={`${pdfUrl}#page=${page}`} className="h-[68vh] min-h-[38rem] w-full rounded-lg bg-[#f5f5f2]" /> : <div className="grid h-[68vh] min-h-[38rem] place-items-center rounded-lg border border-[#713b37] bg-[#21191a] p-6 text-center text-sm text-[#ef675d]" role="alert">{pdfError || "This book could not be loaded."}</div>}<aside className="rounded-lg border border-[#4b3a29] bg-[#211d18]/70 p-4"><p className="eyebrow">Review beside page</p><p className="mt-2 text-xs leading-5 text-[#9297a1]">{book.description}</p><label className="mt-4 block text-xs text-[#c3c7ce]">Your note<textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} rows={8} placeholder="Record a fact to verify or a Kizashi follow-up…" className="mt-2 w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /></label><div className="mt-3 flex items-center justify-between gap-2"><span className="text-[11px] text-[#6fb98f]" role="status">{saved ? "Saved locally" : `Page ${page}`}</span><button type="button" onClick={saveNote} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Save note</button></div><p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#676c75]">Notes stay on this device and do not publish extracted book content.</p></aside></div></section>;
}
