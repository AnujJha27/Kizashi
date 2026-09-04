export function Landscape({ areaId = "neighborhood", stageId = "arrival" }: Readonly<{ areaId?: string; stageId?: string }>) {
  const livedIn = stageId === "lived-in" || stageId === "settled";
  const settled = stageId === "settled";
  const station = areaId === "station" || areaId === "wide-station";
  const street = areaId === "shopping-street" || areaId === "market";
  const riverside = areaId === "riverside";
  const garden = areaId === "garden" || areaId === "neighborhood";
  return (
    <div className="absolute inset-x-0 bottom-0 h-60 overflow-hidden opacity-95" data-world-area={areaId} data-world-stage={stageId} aria-hidden="true">
      <svg viewBox="0 0 900 280" className="h-full w-full" preserveAspectRatio="none">
        <path d="M0 183 C95 157 137 174 215 147 C282 124 319 148 385 128 C457 105 493 137 563 116 C642 92 698 128 761 105 C821 84 861 102 900 89 V280 H0Z" fill="#252136" />
        <path d="M0 215 C104 190 169 210 257 183 C349 155 403 190 489 164 C578 138 635 179 721 151 C793 128 850 151 900 135 V280 H0Z" fill="#191b27" />
        <path d="M0 237 C116 214 211 235 309 207 C409 179 491 224 585 193 C693 157 776 195 900 166 V280 H0Z" fill="#111216" />
        <path d="M80 210 C191 187 274 205 367 178 C471 148 533 192 629 164 C715 139 784 162 851 143" fill="none" stroke="#e5b85c" strokeDasharray="3 10" strokeLinecap="round" strokeOpacity=".7" strokeWidth="2" />
        <path d="M0 247 C124 229 209 249 313 222 C422 193 502 237 603 210 C716 181 805 213 900 190" fill="none" stroke="#403348" strokeWidth="1" />
        <path d="M89 119 C128 104 161 105 194 116 C171 111 147 120 125 124 C109 126 98 124 89 119Z" fill="#d0b8b1" opacity=".16" />
        <path d="M690 93 C721 83 752 85 778 95 C755 92 733 99 713 101 C702 102 695 99 690 93Z" fill="#d0b8b1" opacity=".13" />
        <g fill="#090a0d" opacity=".9">
          <path d="M136 212 l10-45 10 45z" /><path d="M151 212 l14-62 14 62z" />
          <path d="M776 175 l10-48 10 48z" /><path d="M793 177 l16-68 16 68z" />
          <path d="M838 190 l8-34 8 34z" />
        </g>
        <g fill="#e5b85c" opacity=".8"><circle cx="665" cy="188" r="2" /><circle cx="672" cy="180" r="1.5" /><circle cx="680" cy="186" r="1" /><circle cx="714" cy="157" r="1.2" /></g>
        {station ? <g fill="#101b2b" stroke="#e5b85c" strokeWidth="1.5"><path d="M560 173h174v8H560z" /><path d="M578 173l20-20h98l20 20z" /><path d="M590 181v30M704 181v30" /><path d="M560 217h174" /><path d="M575 223h159M575 230h159" fill="none" /></g> : null}
        {station && settled ? <g fill="#e34a3f"><path d="M610 198h86v18h-86z" /><path d="M624 190h58l12 8h-82z" /></g> : null}
        {street ? <g fill="#352a2d" stroke="#c58a5d" strokeWidth="1.5"><path d="M116 204h92v-45h-92z" /><path d="M228 204h96v-57h-96z" /><path d="M350 204h80v-38h-80z" /><path d="M109 159h106l-12-10h-82z" /><path d="M221 147h110l-12-10h-86z" /><path d="M343 166h94l-10-9h-73z" /></g> : null}
        {street && livedIn ? <g fill="#e5b85c"><rect x="132" y="174" width="22" height="13" /><rect x="253" y="166" width="25" height="17" /><rect x="374" y="176" width="18" height="11" /></g> : null}
        {riverside ? <g fill="none" stroke="#6f9eae" strokeWidth="2" opacity=".85"><path d="M488 214c34-12 58 12 92 0s58 12 92 0 58 12 92 0" /><path d="M470 228c34-12 58 12 92 0s58 12 92 0 58 12 92 0" /><path d="M532 241c28-9 48 9 76 0s48 9 76 0 48 9 76 0" /></g> : null}
        {garden ? <g fill="#14251f" stroke="#6f937b" strokeWidth="1"><path d="M64 214l20-58 20 58z" /><path d="M45 214l14-38 14 38z" /><path d="M720 194l18-53 18 53z" /></g> : null}
        {settled ? <g fill="#f1cf7c" opacity=".95"><circle cx="455" cy="184" r="2" /><circle cx="468" cy="178" r="1.5" /><circle cx="482" cy="181" r="2" /><circle cx="496" cy="173" r="1.5" /></g> : null}
      </svg>
    </div>
  );
}
