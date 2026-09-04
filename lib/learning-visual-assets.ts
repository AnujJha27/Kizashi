export type ReadingVisualFormat = "notice" | "menu" | "timetable" | "schedule" | "sale" | "event" | "directions" | "hotel" | "work" | "health" | "school" | "home" | "restaurant" | "museum" | "weather" | "delivery" | "transport";

export const readingVisualAssets: Record<ReadingVisualFormat, string> = {
  notice: "/learning-assets/reading/home-notice.png",
  menu: "/learning-assets/reading/cafe-counter.png",
  timetable: "/learning-assets/reading/station-schedule.png",
  schedule: "/learning-assets/reading/station-schedule.png",
  sale: "/learning-assets/reading/cafe-counter.png",
  event: "/learning-assets/reading/classroom-notice.png",
  directions: "/learning-assets/reading/station-schedule.png",
  hotel: "/learning-assets/reading/home-notice.png",
  work: "/learning-assets/reading/classroom-notice.png",
  health: "/learning-assets/reading/classroom-notice.png",
  school: "/learning-assets/reading/classroom-notice.png",
  home: "/learning-assets/reading/home-notice.png",
  restaurant: "/learning-assets/reading/cafe-counter.png",
  museum: "/learning-assets/reading/classroom-notice.png",
  weather: "/learning-assets/reading/home-notice.png",
  delivery: "/learning-assets/reading/home-notice.png",
  transport: "/learning-assets/reading/station-schedule.png",
};

const listeningVisualAssets = Object.freeze({
  station: "/learning-assets/listening/station-help.png",
  cafe: "/learning-assets/listening/cafe-service.png",
  classroom: "/learning-assets/listening/classroom.png",
  home: "/learning-assets/listening/home-arrival.png",
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
