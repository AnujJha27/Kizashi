"use client";

export function StudyPortrait({ level, rhythm }: Readonly<{ level: number; rhythm: number }>) {
  const safeLevel = Math.max(1, level);
  const chapter = Math.floor((safeLevel - 1) / 3) + 1;
  const chapterProgress = (((safeLevel - 1) % 3) + 1) / 3 * 100;
  const lanterns = Math.min(6, Math.max(1, Math.ceil(safeLevel / 2)));
  const lights = Math.min(8, Math.max(1, rhythm));

  return (
    <div className="study-portrait relative overflow-hidden rounded-2xl border border-[#617486]/55 bg-[#102536] shadow-[0_22px_55px_rgba(3,10,18,.24)]" aria-label={"Journey portrait, level " + safeLevel + ", " + rhythm + " day rhythm"}>
      <svg viewBox="0 0 900 300" className="h-60 w-full" role="img" aria-label="A path through a quiet evening landscape">
        <defs>
          <linearGradient id="portrait-sky" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#416b91" /><stop offset=".52" stopColor="#c18b76" /><stop offset="1" stopColor="#2b2944" /></linearGradient>
          <linearGradient id="portrait-ground" x1="0" x2="1"><stop stopColor="#172e42" /><stop offset="1" stopColor="#402938" /></linearGradient>
          <radialGradient id="portrait-glow"><stop stopColor="#f1cf7c" stopOpacity=".42" /><stop offset="1" stopColor="#f1cf7c" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="900" height="300" fill="url(#portrait-sky)" />
        <circle cx="704" cy="70" r="74" fill="url(#portrait-glow)" />
        <circle cx="704" cy="70" r="27" fill="#f1cf7c" opacity=".92" />
        <path d="M0 83 C92 54 144 78 223 61 C308 42 364 80 438 60 C522 38 590 67 660 53 C746 36 824 52 900 35 V145 H0Z" fill="#d9ae95" opacity=".18" />
        <path d="M0 164 C110 125 193 161 292 130 C396 98 461 151 555 120 C655 88 737 135 900 89 V300 H0Z" fill="#302c49" opacity=".96" />
        <path d="M0 209 C124 170 222 210 342 169 C466 127 564 192 679 151 C769 119 841 151 900 130 V300 H0Z" fill="url(#portrait-ground)" />
        <path d="M72 300 C226 253 385 268 533 215 C657 171 754 156 862 135" fill="none" stroke="#e5b85c" strokeDasharray="3 12" strokeLinecap="round" strokeWidth="2" opacity=".9" />
        <path d="M0 267 C131 229 238 270 372 228 C499 188 610 237 724 202 C803 177 855 188 900 173" fill="none" stroke="#806777" strokeWidth="1.2" opacity=".7" />
        <path d="M80 102 C145 78 193 91 232 111 C186 99 143 109 101 120 C91 120 84 113 80 102Z" fill="#fff2d1" opacity=".16" />
        <path d="M530 99 C588 76 634 87 674 105 C628 98 584 110 548 118 C539 117 534 110 530 99Z" fill="#fff2d1" opacity=".12" />
        <g fill="#081019" opacity=".94"><path d="M105 211 l19-72 19 72z" /><path d="M139 211 l27-98 27 98z" /><path d="M807 177 l18-68 18 68z" /><path d="M835 179 l22-88 22 88z" /></g>
        <g fill="#f1cf7c" opacity=".95">{Array.from({ length: lights }, (_, index) => <circle key={index} cx={180 + index * 75} cy={247 - index * 6} r={index % 3 === 0 ? 2.5 : 1.5} />)}</g>
        <g fill="#e34a3f" opacity=".92">{Array.from({ length: lanterns }, (_, index) => <g key={index} transform={"translate(" + (265 + index * 76) + " " + (192 - index * 7) + ")"}><path d="M-4 0h8l-1 18h-6z" /><circle cy="8" r="2.5" fill="#f1cf7c" /></g>)}</g>
      </svg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0d1725]/20 via-transparent to-[#0c1723]/90" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="rounded-xl border border-white/15 bg-[#102536]/40 px-3 py-2 backdrop-blur-sm">
          <p className="eyebrow">Current scenery · 現在地</p>
          <p className="jp-serif mt-1 text-2xl tracking-[.12em] text-[#f5f5f2]">旅の景色</p>
        </div>
        <span className="rounded-full border border-[#f1cf7c]/35 bg-[#102536]/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.14em] text-[#f1cf7c]">level {safeLevel}</span>
      </div>
      <div className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-[#f1cf7c]/45 bg-[#162b3b]/70 font-serif text-lg text-[#f1cf7c] shadow-lg backdrop-blur-sm">道</div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-4 sm:p-5">
        <div><p className="jp-serif text-lg text-[#f5f5f2]">静かな道</p><p className="mt-1 text-xs text-[#d8dde4]">Every session changes the horizon.</p></div>
        <div className="w-36 shrink-0">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full rounded-full bg-[#f1cf7c]" style={{ width: chapterProgress + "%" }} /></div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-[.12em] text-[#d8dde4]"><span>Chapter {chapter}</span><span>{rhythm} day rhythm</span></div>
        </div>
      </div>
    </div>
  );
}
