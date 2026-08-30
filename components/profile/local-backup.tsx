"use client";

import { useState } from "react";

import { createLocalBackup, restoreLocalBackup } from "@/lib/session";

export function LocalBackup() {
  const [message, setMessage] = useState("");

  const download = () => {
    const url = URL.createObjectURL(new Blob([createLocalBackup()], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `kizashi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup downloaded.");
  };

  const restore = async (file: File | undefined) => {
    if (!file || !window.confirm("Restore this backup and overwrite matching local Kizashi data?")) return;
    try {
      const count = restoreLocalBackup(await file.text());
      setMessage(`${count} records restored. Reloading…`);
      window.setTimeout(() => window.location.reload(), 250);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not restore that backup.");
    }
  };

  return <section className="surface-panel-raised p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Local backup · 保存</p><p className="text-sm leading-6 text-[#9297a1]">Keep your reviews, notes, study queue, and preferences portable while auth is deferred.</p><p className="mt-2 text-xs text-[#e5b85c]" role="status">{message}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={download} className="rounded-xl border border-[#5d3936] px-4 py-3 text-xs font-semibold text-[#f5f5f2] hover:border-[#e5b85c]">Download backup</button><label className="cursor-pointer rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-[#9297a1] hover:border-[#e5b85c] hover:text-[#f5f5f2]">Restore backup<input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => { void restore(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label></div></div></section>;
}
