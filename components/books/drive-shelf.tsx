"use client";

import { studyDrive } from "@/lib/books";

export function DriveShelf() {
  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${studyDrive.folderId}#grid`;
  return <section className="surface-panel overflow-hidden p-2 sm:p-3"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-2 pb-3"><div><p className="eyebrow">Google Drive · 私の本棚</p><h1 className="jp-serif mt-1 text-2xl text-[#f5f5f2] sm:text-3xl">Your complete book shelf</h1><p className="mt-1 text-sm text-[#9297a1]">Books stay in your shared Drive folder and open here.</p></div><a href={studyDrive.folderUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[#e5b85c] px-3 py-2 text-xs font-semibold text-[#f1cf7c] hover:bg-[#302818]">Open in Drive ↗</a></div><iframe title="Kizashi study books in Google Drive" src={embedUrl} className="mt-2 h-[72vh] min-h-[38rem] w-full rounded-lg bg-white" allow="fullscreen" /><p className="px-2 pb-1 pt-3 text-xs leading-5 text-[#9297a1]">Sign in to the Google account that can access the shared folder. If the embedded view is blocked by your browser, use Open in Drive.</p></section>;
}
