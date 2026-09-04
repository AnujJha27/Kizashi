export type ReadingVisualFormat = "notice" | "menu" | "timetable" | "schedule" | "sale" | "event" | "directions" | "hotel" | "work" | "health" | "school" | "home" | "restaurant" | "museum" | "weather" | "delivery" | "transport";

export const readingVisualAssets: Record<ReadingVisualFormat, string> = {
  notice: "/learning-assets/reading/home-notice.webp",
  menu: "/learning-assets/reading/cafe-counter.webp",
  timetable: "/learning-assets/reading/station-schedule.webp",
  schedule: "/learning-assets/reading/station-schedule.webp",
  sale: "/learning-assets/reading/cafe-counter.webp",
  event: "/learning-assets/reading/classroom-notice.webp",
  directions: "/learning-assets/reading/station-schedule.webp",
  hotel: "/learning-assets/reading/home-notice.webp",
  work: "/learning-assets/reading/classroom-notice.webp",
  health: "/learning-assets/reading/classroom-notice.webp",
  school: "/learning-assets/reading/classroom-notice.webp",
  home: "/learning-assets/reading/home-notice.webp",
  restaurant: "/learning-assets/reading/cafe-counter.webp",
  museum: "/learning-assets/reading/classroom-notice.webp",
  weather: "/learning-assets/reading/home-notice.webp",
  delivery: "/learning-assets/reading/home-notice.webp",
  transport: "/learning-assets/reading/station-schedule.webp",
};

const listeningVisualAssets = Object.freeze({
  station: "/learning-assets/listening/station-help.webp",
  cafe: "/learning-assets/listening/cafe-service.webp",
  classroom: "/learning-assets/listening/classroom.webp",
  home: "/learning-assets/listening/home-arrival.webp",
});

export function listeningVisualAsset(scene: string) {
  if (["station", "waiting-station", "directions", "asking-directions", "travel"].includes(scene)) return listeningVisualAssets.station;
  if (["shop", "counter", "restaurant", "paying-shop", "ordering-food", "passing-object", "meeting", "meeting-someone", "event"].includes(scene)) return listeningVisualAssets.cafe;
  if (["room", "school-class", "entering-room", "clinic", "library", "work", "asking-help", "using-elevator", "arriving-late", "offering-seat"].includes(scene)) return listeningVisualAssets.classroom;
  return listeningVisualAssets.home;
}

export const learningVisualManifest = Object.freeze([
  ...Object.entries(readingVisualAssets).map(([id, path]) => ({ id: `reading-${id}`, path, role: "reading-support", sourceType: "generated-raster", creator: "OpenAI image generation, commissioned by Kizashi", license: "Kizashi project asset", attribution: "Kizashi generated asset" })),
  ...Object.entries(listeningVisualAssets).map(([id, path]) => ({ id: `listening-${id}`, path, role: "listening-context", sourceType: "generated-raster", creator: "OpenAI image generation, commissioned by Kizashi", license: "Kizashi project asset", attribution: "Kizashi generated asset" })),
]);
