"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";

import { readBookSketchPages, writeBookSketchPages } from "@/lib/session";

const WIDTH = 1000;
const HEIGHT = 1414;
const COLORS = ["#182233", "#c73d35", "#246f9d", "#287d52"];
const encoder = new TextEncoder();

function bytes(dataUrl: string) {
  return Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(",") + 1)), (character) => character.charCodeAt(0));
}

async function jpegPage(dataUrl: string) {
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not export notebook page.")); image.src = dataUrl; });
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not export notebook page.");
  context.fillStyle = "#f7f3e8";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.drawImage(image, 0, 0, WIDTH, HEIGHT);
  return bytes(canvas.toDataURL("image/jpeg", 0.9));
}

function notebookPdf(images: Uint8Array[]) {
  const parts: Uint8Array[] = [];
  const objectCount = 2 + images.length * 3;
  const offsets = Array<number>(objectCount + 1).fill(0);
  let offset = 0;
  const add = (value: string | Uint8Array) => { const next = typeof value === "string" ? encoder.encode(value) : value; parts.push(next); offset += next.length; };
  const object = (id: number, body: string | Uint8Array) => { offsets[id] = offset; add(`${id} 0 obj\n`); add(body); add("\nendobj\n"); };
  add("%PDF-1.4\n%âãÏÓ\n");
  object(1, "<< /Type /Catalog /Pages 2 0 R >>");
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${3 + index * 3} 0 R`).join(" ")}] >>`);
  images.forEach((image, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const content = `q\n595 0 0 842 0 0 cm\n/Im${index} Do\nQ`;
    object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    object(contentId, `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
    const header = encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${WIDTH} /Height ${HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`);
    const body = new Uint8Array(header.length + image.length + 10);
    body.set(header);
    body.set(image, header.length);
    body.set(encoder.encode("\nendstream"), header.length + image.length);
    object(imageId, body);
  });
  const xrefOffset = offset;
  add(`xref\n0 ${objectCount + 1}\n0000000000 65535 f \n${offsets.slice(1).map((entry) => `${String(entry).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
  return new Blob(parts.map((part) => part.buffer.slice(part.byteOffset, part.byteOffset + part.byteLength) as ArrayBuffer), { type: "application/pdf" });
}

export function HandwrittenNotes({ bookId }: Readonly<{ bookId: string }>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const [pages, setPages] = useState<string[]>([""]);
  const [page, setPage] = useState(0);
  const [color, setColor] = useState(COLORS[0]);
  const [highlighter, setHighlighter] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const paintPaper = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#f7f3e8";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    const next = readBookSketchPages(bookId);
    setPages(next);
    setPage(0);
  }, [bookId]);

  useEffect(() => {
    paintPaper();
    const sketch = pages[page];
    if (!sketch) return;
    const image = new Image();
    image.onload = () => { paintPaper(); canvasRef.current?.getContext("2d")?.drawImage(image, 0, 0, WIDTH, HEIGHT); };
    image.src = sketch;
  }, [page, pages]);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * (WIDTH / bounds.width), y: (event.clientY - bounds.top) * (HEIGHT / bounds.height) };
  };

  const draw = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;
    context.strokeStyle = highlighter ? "#f0d24a" : color;
    context.globalAlpha = highlighter ? 0.32 : 1;
    context.lineWidth = highlighter ? 34 : 5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
    context.globalAlpha = 1;
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const next = [...pages];
      next[page] = canvas.toDataURL("image/png");
      writeBookSketchPages(bookId, next);
      setPages(next);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  };

  const clearPage = () => {
    paintPaper();
    const next = [...pages];
    next[page] = "";
    writeBookSketchPages(bookId, next);
    setPages(next);
    setSaved(true);
  };

  const addPage = () => {
    const next = [...pages, ""];
    writeBookSketchPages(bookId, next);
    setPages(next);
    setPage(next.length - 1);
    setSaved(true);
  };

  const exportPdf = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    try {
      const next = [...pages];
      next[page] = canvas.toDataURL("image/png");
      const images = await Promise.all(next.filter(Boolean).map(jpegPage));
      if (!images.length) return;
      const url = URL.createObjectURL(notebookPdf(images));
      const link = document.createElement("a");
      link.download = `${bookId}-handwritten-notes.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return <details className="mb-5 border-b border-white/10 pb-5"><summary className="cursor-pointer text-xs font-semibold text-[#c3c7ce]">Handwritten scratchpad</summary><p className="mt-2 text-[11px] leading-5 text-[#676c75]">A local notebook for this book.</p><div className="mt-3 flex flex-wrap items-center gap-2"><button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-[#3f4652] px-2 py-1 text-[11px] disabled:opacity-40">←</button><span className="text-[11px] text-[#9297a1]">Page {page + 1}</span><button type="button" disabled={page >= pages.length - 1} onClick={() => setPage(page + 1)} className="rounded border border-[#3f4652] px-2 py-1 text-[11px] disabled:opacity-40">→</button><button type="button" onClick={addPage} className="rounded border border-[#3f4652] px-2 py-1 text-[11px] hover:border-[#e5b85c]">+ Page</button><button type="button" disabled={exporting} onClick={() => void exportPdf()} className="rounded border border-[#3f4652] px-2 py-1 text-[11px] hover:border-[#e5b85c] disabled:opacity-40">{exporting ? "Exporting…" : "Export PDF"}</button><button type="button" onClick={clearPage} className="ml-auto text-[11px] text-[#ef675d] hover:text-[#f58f88]">Clear</button></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[11px] text-[#9297a1]">Pen</span>{COLORS.map((value) => <button key={value} type="button" onClick={() => { setColor(value); setHighlighter(false); }} aria-label={`Use ${value} pen`} className={`h-6 w-6 rounded-full border-2 ${!highlighter && color === value ? "border-[#e5b85c]" : "border-white/20"}`} style={{ backgroundColor: value }} />)}<button type="button" onClick={() => setHighlighter(!highlighter)} className={`rounded border px-2 py-1 text-[11px] ${highlighter ? "border-[#e5b85c] bg-[#302818] text-[#f1cf7c]" : "border-[#3f4652]"}`}>Highlighter</button><span className="text-[11px] text-[#6fb98f]">{saved ? "Saved locally" : "Draw with pen or touch"}</span></div><canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onPointerDown={(event) => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); lastPoint.current = point(event); draw(lastPoint.current, lastPoint.current); setSaved(false); }} onPointerMove={(event) => { if (!drawing.current) return; const next = point(event); draw(lastPoint.current, next); lastPoint.current = next; }} onPointerUp={(event) => { if (!drawing.current) return; drawing.current = false; event.currentTarget.releasePointerCapture(event.pointerId); save(); }} onPointerCancel={() => { drawing.current = false; save(); }} className="mt-3 w-full touch-none rounded-lg border border-[#3f4652] bg-[#f7f3e8]" style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }} aria-label="Handwritten notes for this book" /></details>;
}
