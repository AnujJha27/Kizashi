import { listeningVisualAsset } from "@/lib/learning-visual-assets";

const labels: Record<string, string> = {
  station: "station counter",
  "waiting-station": "waiting at a station",
  counter: "service counter",
  room: "classroom",
  "school-class": "school/class situation",
  "entering-room": "entering a room",
  home: "home entrance",
  "leaving-home": "leaving home",
  "returning-home": "returning home",
  shop: "shop",
  "paying-shop": "paying at a shop",
  meeting: "meeting",
  "meeting-someone": "meeting someone",
  clinic: "clinic",
  "asking-help": "asking for help",
  directions: "directions",
  "asking-directions": "asking directions",
  library: "library",
  restaurant: "restaurant",
  "ordering-food": "ordering food",
  "passing-object": "passing an object",
  "using-elevator": "using an elevator",
  "arriving-late": "arriving late",
  "offering-seat": "offering a seat",
  "dropping-something": "dropping something",
  meal: "meal",
  event: "event",
  travel: "travel desk",
  work: "workplace",
};

export function ListeningScene({ scene, description }: Readonly<{ scene: string; description?: string }>) {
  const label = labels[scene] ?? "everyday situation";
  const asset = listeningVisualAsset(scene);
  return <figure className="mt-5 overflow-hidden rounded-xl border border-[#3f4652] bg-[#101b2b]/70" aria-label={`Original visual context: ${description ?? label}`}><img src={asset} alt={description ?? `Original illustration of a ${label}`} width={1536} height={1024} className="h-36 w-full object-cover" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} /><figcaption className="border-t border-white/10 px-3 py-2 text-[11px] leading-5 text-[#9297a1]">Visual context · {description ?? label}</figcaption></figure>;
}
