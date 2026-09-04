import type { ReactNode } from "react";

const labels: Record<string, string> = {
  station: "station counter",
  counter: "service counter",
  room: "classroom",
  home: "home entrance",
  shop: "shop",
  meeting: "meeting",
  clinic: "clinic",
  directions: "directions",
  library: "library",
  restaurant: "restaurant",
  meal: "meal",
  event: "event",
  travel: "travel desk",
  work: "workplace",
};

function foreground(scene: string): ReactNode {
  if (scene === "station" || scene === "directions" || scene === "travel") return <><path d="M90 190h720v12H90zM120 202h20v34h-20zM760 202h20v34h-20z" fill="#26384a" /><path d="M160 190v-42h580v42M195 148l36-32h338l36 32" fill="none" stroke="#e5b85c" strokeWidth="5" /><path d="M210 175h95M330 175h95M450 175h95M570 175h95" stroke="#8cc9e5" strokeWidth="5" /></>;
  if (scene === "shop" || scene === "counter" || scene === "restaurant") return <><path d="M140 118h620v116H140z" fill="#30272a" stroke="#c58a5d" strokeWidth="5" /><path d="M120 118h660l-28-35H148z" fill="#6c3940" stroke="#e5b85c" strokeWidth="5" /><path d="M205 150h130v52H205zM385 150h130v52H385zM565 150h130v52H565z" fill="#172a38" stroke="#8cc9e5" strokeWidth="4" /></>;
  if (scene === "clinic" || scene === "library" || scene === "room" || scene === "work") return <><path d="M145 92h610v145H145z" fill="#202b35" stroke="#7198a8" strokeWidth="5" /><path d="M190 130h155v72H190zM375 130h155v72H375zM560 130h155v72H560z" fill="#111216" stroke="#e5b85c" strokeWidth="4" /></>;
  if (scene === "home" || scene === "meal") return <><path d="M155 136l295-76 295 76v101H155z" fill="#302833" stroke="#b78d67" strokeWidth="5" /><path d="M285 145h130v92H285zM505 165h92v72h-92z" fill="#111216" stroke="#e5b85c" strokeWidth="4" /></>;
  return <><path d="M90 230c170-54 270-54 430 0s260 54 290 0" fill="none" stroke="#6f937b" strokeWidth="7" /><circle cx="165" cy="134" r="38" fill="#6f937b" /><circle cx="735" cy="126" r="46" fill="#6f937b" /><path d="M165 172v58M735 172v58" stroke="#6f937b" strokeWidth="9" /></>;
}

export function ListeningScene({ scene, description }: Readonly<{ scene: string; description?: string }>) {
  const label = labels[scene] ?? "everyday situation";
  const gradientId = `listening-scene-${scene}`;
  return <figure className="mt-5 overflow-hidden rounded-xl border border-[#3f4652] bg-[#101b2b]/70" aria-label={`Original visual context: ${description ?? label}`}><svg viewBox="0 0 900 270" className="h-36 w-full" role="img" aria-label={description ?? `Original illustration of a ${label}`}><defs><linearGradient id={gradientId} x1="0" x2="1"><stop stopColor="#162b3d" /><stop offset="1" stopColor="#3c2936" /></linearGradient></defs><rect width="900" height="270" fill={`url(#${gradientId})`} /><circle cx="760" cy="62" r="32" fill="#e5b85c" opacity=".72" /><path d="M0 230h900v40H0z" fill="#0b0b0d" opacity=".8" />{foreground(scene)}<g fill="#e34a3f"><circle cx="395" cy="184" r="22" /><path d="M374 207h42l18 42h-78z" /></g><g fill="#8cc9e5"><circle cx="525" cy="184" r="22" /><path d="M504 207h42l18 42h-78z" /></g><path d="M414 152h72" stroke="#f5f5f2" strokeWidth="3" strokeDasharray="7 7" /><path d="M450 141v-21" stroke="#f5f5f2" strokeWidth="3" /></svg><figcaption className="border-t border-white/10 px-3 py-2 text-[11px] leading-5 text-[#9297a1]">Visual context · {description ?? label}</figcaption></figure>;
}
