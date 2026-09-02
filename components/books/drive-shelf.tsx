"use client";

import { useEffect, useRef, useState } from "react";

import { HandwrittenNotes } from "@/components/books/handwritten-notes";
import { studyDrive } from "@/lib/books";
import { GOOGLE_DRIVE_READONLY_SCOPE, isDriveFolder, isDrivePdf, type GoogleDriveFile } from "@/lib/google-drive";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type FolderCrumb = { id: string; name: string };

function fileSize(size?: string) {
  const bytes = Number(size);
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  return `${(bytes / 1_048_576).toFixed(bytes >= 10 * 1_048_576 ? 0 : 1)} MB`;
}

export function DriveShelf() {
  const [token, setToken] = useState("");
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [crumbs, setCrumbs] = useState<FolderCrumb[]>([{ id: studyDrive.folderId, name: "Study books" }]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfId, setPdfId] = useState("");
  const objectUrl = useRef("");
  const folderId = crumbs.at(-1)?.id ?? studyDrive.folderId;

  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/books/drive/token", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { accessToken?: string; error?: string };
        if (!response.ok || !body.accessToken) throw new Error(body.error ?? "Drive could not be connected.");
        if (!cancelled) setToken(body.accessToken);
      })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "Drive could not be connected."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({
      q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
      fields: "files(id,name,mimeType,size,modifiedTime)",
      orderBy: "folder,name_natural",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json() as { files?: GoogleDriveFile[]; error?: { message?: string } };
        if (!response.ok) throw new Error(body.error?.message ?? "Drive folder could not be loaded.");
        if (!cancelled) setFiles((body.files ?? []).filter((file) => isDriveFolder(file) || isDrivePdf(file)));
      })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "Drive folder could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [folderId, token]);

  const connect = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setMessage("Google Drive needs the configured Kizashi sign-in."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/books/drive&drive=1`,
        scopes: GOOGLE_DRIVE_READONLY_SCOPE,
        queryParams: { access_type: "online", prompt: "consent" },
      },
    });
    if (error) { setLoading(false); setMessage(error.message); }
  };

  const openPdf = async (file: GoogleDriveFile) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("This PDF could not be opened from Drive.");
      const blob = await response.blob();
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(blob);
      setPdfUrl(objectUrl.current);
      setPdfTitle(file.name);
      setPdfId(file.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "This PDF could not be opened from Drive.");
    } finally {
      setLoading(false);
    }
  };

  if (pdfUrl) return <section className="surface-panel overflow-hidden p-2 sm:p-3"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-2 pb-3"><div><p className="eyebrow">Google Drive · 私の本棚</p><h1 className="jp-serif mt-1 text-2xl text-[#f5f5f2]">{pdfTitle}</h1></div><button type="button" onClick={() => { URL.revokeObjectURL(pdfUrl); objectUrl.current = ""; setPdfUrl(""); setPdfId(""); }} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">← Back to shelf</button></div><iframe title={pdfTitle} src={pdfUrl} className="mt-2 h-[72vh] min-h-[38rem] w-full rounded-lg bg-white" /><aside className="mt-3 rounded-lg border border-[#4b3a29] bg-[#211d18]/70 p-4"><HandwrittenNotes bookId={`drive-${pdfId}`} /></aside></section>;

  return <section className="surface-panel overflow-hidden p-3 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4"><div><p className="eyebrow">Google Drive · 私の本棚</p><h1 className="jp-serif mt-1 text-2xl text-[#f5f5f2] sm:text-3xl">Your complete book shelf</h1><p className="mt-1 text-sm text-[#9297a1]">Browse folders and open PDFs without leaving Kizashi.</p></div>{!token ? <button type="button" disabled={loading} onClick={() => void connect()} className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] enabled:hover:bg-[#302818] disabled:opacity-50">Connect Google Drive</button> : null}</div>{token ? <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#9297a1]">{crumbs.map((crumb, index) => <span key={crumb.id} className="flex items-center gap-2">{index ? <span>/</span> : null}<button type="button" onClick={() => setCrumbs((value) => value.slice(0, index + 1))} className="text-[#e5b85c] hover:text-[#f1cf7c]">{crumb.name}</button></span>)}</div> : null}{message ? <div className="mt-5 rounded-lg border border-[#713b37] bg-[#21191a] p-4 text-sm text-[#ef675d]">{message}</div> : null}{loading ? <div className="grid h-64 place-items-center text-sm text-[#9297a1]">Loading your Drive shelf…</div> : token ? <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{files.length ? files.map((file) => <button key={file.id} type="button" onClick={() => isDriveFolder(file) ? setCrumbs((value) => [...value, { id: file.id, name: file.name }]) : void openPdf(file)} className="rounded-xl border border-white/10 bg-[#17181d]/70 p-4 text-left transition hover:border-[#e5b85c]/70 hover:bg-[#211d18]"><p className="text-sm font-semibold text-[#f5f5f2]">{isDriveFolder(file) ? "📁" : "📄"} {file.name}</p><p className="mt-2 text-xs text-[#9297a1]">{isDriveFolder(file) ? "Open folder" : fileSize(file.size) || "Open PDF"}</p></button>) : <p className="col-span-full py-10 text-sm text-[#9297a1]">No PDF files or folders are in this folder.</p>}</div> : <div className="py-10 text-sm leading-6 text-[#9297a1]">Connect once to give Kizashi read-only Drive access for this browser session. The shelf then stays entirely inside the app.</div>}</section>;
}
