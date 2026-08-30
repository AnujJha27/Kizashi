"use client";

import { useEffect, useState } from "react";

import { PROFILE_PREFERENCES_STORAGE_KEY, type AnswerLeniency, type FuriganaMode } from "@/lib/session";

const STORAGE_KEY = PROFILE_PREFERENCES_STORAGE_KEY;

interface Preferences {
  displayName: string;
  targetLevel: "N5" | "N4";
  dailyMinutes: "2" | "5" | "10" | "20" | "30";
  examDate: string;
  furiganaMode: FuriganaMode;
  answerLeniency: AnswerLeniency;
  autoPlayAudio: boolean;
}

const defaultPreferences: Preferences = { displayName: "", targetLevel: "N5", dailyMinutes: "10", examDate: "", furiganaMode: "unknown", answerLeniency: "kana", autoPlayAudio: false };

export function ProfileSettings() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value) setPreferences({ ...defaultPreferences, ...JSON.parse(value) });
    } catch {
      setPreferences(defaultPreferences);
    }
  }, []);

  const update = (key: keyof Preferences, value: string) => {
    setSaved(false);
    setPreferences((current) => ({ ...current, [key]: value } as Preferences));
  };

  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new Event("michi-profile-updated"));
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <section className="surface-panel p-6 sm:p-8">
        <div className="mb-7">
          <p className="eyebrow">Your settings</p>
          <h2 className="mt-2 text-xl font-medium">Shape the path around your life.</h2>
          <p className="mt-2 text-sm text-[#9297a1]">Your study preferences are saved on this device.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm text-[#9297a1]">
            Display name
            <input value={preferences.displayName} onChange={(event) => update("displayName", event.target.value)} placeholder="What should Kizashi call you?" className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b]/75 px-4 py-3 text-[#f5f5f2] placeholder:text-[#676c75] focus:border-[#e5b85c] focus:outline-none" />
          </label>
          <label className="text-sm text-[#9297a1]">
            Target level
            <select value={preferences.targetLevel} onChange={(event) => update("targetLevel", event.target.value)} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-4 py-3 text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">
              <option value="N5">JLPT N5</option>
              <option value="N4">JLPT N4</option>
            </select>
          </label>
          <label className="text-sm text-[#9297a1]">
            Daily study
            <select value={preferences.dailyMinutes} onChange={(event) => update("dailyMinutes", event.target.value)} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-4 py-3 text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">
              <option value="2">Micro · 2 minutes</option>
              <option value="5">Quick · 5 minutes</option>
              <option value="10">Steady · 10 minutes</option>
              <option value="20">Focused · 20 minutes</option>
              <option value="30">Deep · 30 minutes</option>
            </select>
          </label>
          <label className="text-sm text-[#9297a1]">
            Furigana
            <select value={preferences.furiganaMode} onChange={(event) => update("furiganaMode", event.target.value)} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-4 py-3 text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">
              <option value="always">Always show · beginner-friendly</option>
              <option value="unknown">Unknown kanji only</option>
              <option value="tap">Show on tap</option>
              <option value="hide">Hide</option>
            </select>
          </label>
          <label className="text-sm text-[#9297a1]">
            Answer checking
            <select value={preferences.answerLeniency} onChange={(event) => update("answerLeniency", event.target.value)} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-4 py-3 text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none">
              <option value="kana">Kana-friendly · recommended</option>
              <option value="strict">Strict · preserve kana script</option>
            </select>
          </label>
          <label className="text-sm text-[#9297a1]">
            Target exam date
            <span className="mt-2 block text-xs text-[#676c75]">Optional · used for pacing later</span>
            <input type="date" value={preferences.examDate} onChange={(event) => update("examDate", event.target.value)} className="mt-2 w-full rounded-xl border border-[#3f4652] bg-[#101b2b] px-4 py-3 text-[#f5f5f2] focus:border-[#e5b85c] focus:outline-none" />
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-[#3f4652] bg-[#101b2b]/55 p-4 text-sm text-[#c3c7ce]">
            <input type="checkbox" checked={preferences.autoPlayAudio} onChange={(event) => { setSaved(false); setPreferences((current) => ({ ...current, autoPlayAudio: event.target.checked })); }} className="mt-0.5 size-4 accent-[#e34a3f]" />
            <span>
              <span className="block text-[#f5f5f2]">Auto-play practice audio</span>
              <span className="mt-1 block text-xs leading-5 text-[#9297a1]">Play Japanese audio when an audio question appears. Off by default.</span>
            </span>
          </label>
        </div>
        <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#292b31] pt-5">
          <p className="text-sm text-[#6fb98f]" role="status">{saved ? "Saved. Your path will use these preferences." : ""}</p>
          <button type="button" onClick={save} className="rounded-xl bg-[#e34a3f] px-4 py-3 text-sm font-semibold text-[#0b0b0d] hover:bg-[#ef675d]">Save settings</button>
        </div>
      </section>
      <section className="surface-panel-raised p-6">
        <p className="eyebrow mb-2">Local-first + sync</p>
        <p className="text-sm leading-6 text-[#9297a1]">Progress, notes, reviews, and preferences stay in this browser first. Enable account sync in Profile to carry the same records across devices.</p>
      </section>
    </div>
  );
}
