import type { CSSProperties } from "react";

import { journeyVisualManifest } from "@/lib/journey-world-core.js";

export function Landscape({ areaId = "neighborhood", stageId = "arrival" }: Readonly<{ areaId?: string; stageId?: string }>) {
  const visual = journeyVisualManifest[areaId] ?? journeyVisualManifest.neighborhood;
  const livedIn = stageId === "lived-in" || stageId === "settled";
  const settled = stageId === "settled";
  return (
    <div className="absolute inset-x-0 bottom-0 h-60 overflow-hidden opacity-95" data-world-area={areaId} data-world-stage={stageId} aria-hidden="true" style={{ "--world-focal": visual.focalPoint.desktop, "--world-focal-mobile": visual.focalPoint.mobile } as CSSProperties}>
      <img src={visual.visualAssets.hero} alt="" width={2172} height={724} loading="lazy" decoding="async" className="world-scene-image h-full w-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} />
      <div className={`absolute inset-0 bg-gradient-to-t from-[#0b0b0d]/85 via-[#101b2b]/15 to-transparent ${livedIn ? "opacity-90" : "opacity-100"}`} />
      <div className={`absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0b0b0d]/65 to-transparent ${settled ? "opacity-70" : "opacity-35"}`} />
    </div>
  );
}
