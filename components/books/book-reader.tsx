"use client";

import { useEffect, useState } from "react";

import { HandwrittenNotes } from "@/components/books/handwritten-notes";
import type { StudyBook } from "@/lib/books";
import { clearBookScreenshot, readBookNote, readBookScreenshot, writeBookNote, writeBookScreenshot } from "@/lib/session";

export function BookReader({ book }: Readonly<{ book: StudyBook }>) {
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [chapterId, setChapterId] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [screenshot, setScreenshot] = useState("");
  const [screenshotMessage, setScreenshotMessage] = useState("");
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
        let blob: Blob | null = null;
        if (manifest.ok) {
          try {
            const payload = await manifest.json() as { parts?: unknown };
            if (!Array.isArray(payload.parts) || !payload.parts.every((part): part is string => typeof part === "string")) throw new Error("Book parts are invalid.");
            const responses = await Promise.all(payload.parts.map((part) => fetch(part)));
            if (responses.some((response) => !response.ok)) throw new Error("Book part unavailable.");
            blob = new Blob(await Promise.all(responses.map((response) => response.blob())), { type: "application/pdf" });
          } catch {
            blob = null;
          }
        }
        if (!blob) {
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
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [book.id]);

  const loadPageState = (next: number) => {
    setPage(next);
    setPageInput(String(next));
    setChapterId(book.chapters?.find((chapter) => chapter.page === next)?.id ?? "");
    setNote(readBookNote(book.id, next));
    setScreenshot(readBookScreenshot(book.id, next));
    setSaved(false);
  };

  useEffect(() => { loadPageState(1); }, [book.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveScreenshot = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 450_000) { setScreenshotMessage("Choose an image smaller than 450 KB."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const value = typeof reader.result === "string" ? reader.result : "";
        writeBookScreenshot(book.id, page, value);
        setScreenshot(value);
        setScreenshotMessage("Screenshot saved locally.");
      } catch (error) {
        setScreenshotMessage(error instanceof Error ? error.message : "Screenshot could not be saved.");
      }
    };
    reader.onerror = () => setScreenshotMessage("Screenshot could not be read.");
    reader.readAsDataURL(file);
  };

  return <section className="surface-panel overflow-hidden p-2 sm:p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-1 pb-3 sm:px-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => loadPageState(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3c7ce] enabled:hover:border-[#e5b85c] disabled:cursor-not-allowed disabled:opacity-40">← Previous</button>
        <button type="button" onClick={() => loadPageState(page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">Next →</button>
        {pdfUrl ? <a href={`${pdfUrl}#page=${page}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Open PDF ↗</a> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {book.chapters?.length ? <label className="flex items-center gap-2 text-xs text-[#9297a1]">Chapter<select aria-label="Book chapter" value={chapterId} onChange={(event) => { const chapter = book.chapters?.find((entry) => entry.id === event.target.value); if (chapter) loadPageState(chapter.page); }} className="max-w-52 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-2 py-2 text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]"><option value="">Choose chapter</option>{book.chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title} · p.{chapter.page}</option>)}</select></label> : null}
        <form onSubmit={(event) => { event.preventDefault(); loadPageState(Math.max(1, Number.parseInt(pageInput, 10) || 1)); }} className="flex items-center gap-2"><label htmlFor="book-page" className="text-xs text-[#9297a1]">Page</label><input id="book-page" type="number" min="1" value={pageInput} onChange={(event) => setPageInput(event.target.value)} className="w-16 rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-2 py-2 text-center text-xs text-[#f5f5f2] outline-none focus:border-[#e5b85c]" /><button type="submit" className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Go</button></form>
      </div>
    </div>
    <div className="mt-2 grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(28rem,1fr)]">
      {pdfLoading ? <div className="grid h-[78vh] min-h-[42rem] place-items-center rounded-lg bg-[#f5f3e8] text-sm text-[#676c75]">Loading book…</div> : pdfUrl ? <iframe key={page} title={`${book.title} PDF · page ${page}`} src={`${pdfUrl}#page=${page}`} className="h-[78vh] min-h-[42rem] w-full rounded-lg bg-[#f5f3e8]" /> : <div className="grid h-[78vh] min-h-[42rem] place-items-center rounded-lg border border-[#713b37] bg-[#21191a] p-6 text-center text-sm text-[#ef675d]" role="alert">{pdfError || "This book could not be loaded."}</div>}
      <aside className="min-w-0 rounded-lg border border-[#4b3a29] bg-[#211d18]/70 p-4">
        <HandwrittenNotes bookId={book.id} />
        <p className="eyebrow">Review beside page</p><p className="mt-2 text-xs leading-5 text-[#9297a1]">{book.description}</p>
        <label className="mt-4 block text-xs text-[#c3c7ce]">Your note<textarea value={note} onChange={(event) => { setNote(event.target.value); setSaved(false); }} rows={8} placeholder="Record a fact to verify or a Kizashi follow-up…" className="mt-2 w-full resize-y rounded-lg border border-[#3f4652] bg-[#101b2b]/90 px-3 py-2.5 text-sm text-[#f5f5f2] outline-none placeholder:text-[#676c75] focus:border-[#e5b85c]" /></label>
        <div className="mt-3 flex items-center justify-between gap-2"><span className="text-[11px] text-[#6fb98f]" role="status">{saved ? "Saved locally" : `Page ${page}`}</span><button type="button" onClick={() => { writeBookNote(book.id, page, note); setSaved(true); }} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Save note</button></div>
        <div className="mt-5 border-t border-white/10 pt-4"><p className="text-xs font-semibold text-[#c3c7ce]">Page screenshot</p><p className="mt-1 text-[11px] leading-5 text-[#676c75]">Keep a personal crop beside this page. It stays in this browser and is never published.</p><label className="mt-3 inline-flex cursor-pointer rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#c3c7ce] hover:border-[#e5b85c]">{screenshot ? "Replace screenshot" : "Add screenshot"}<input type="file" accept="image/*" className="sr-only" onChange={(event) => { saveScreenshot(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label>{screenshotMessage ? <p className="mt-2 text-[11px] text-[#e5b85c]" role="status">{screenshotMessage}</p> : null}{screenshot ? <><img src={screenshot} alt={`Personal screenshot for page ${page}`} className="mt-3 max-h-56 w-full rounded-lg border border-white/10 object-contain" /><button type="button" onClick={() => { clearBookScreenshot(book.id, page); setScreenshot(""); setScreenshotMessage("Screenshot removed."); }} className="mt-2 text-[11px] text-[#ef675d] hover:text-[#ef675d]">Remove screenshot</button></> : null}</div>
        <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#676c75]">Notes and screenshots stay on this device and do not publish extracted book content.</p>
      </aside>
    </div>
  </section>;
}
