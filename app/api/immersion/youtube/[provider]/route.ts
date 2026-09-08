import { parseYouTubeVideoFeed } from "@/lib/shun-catalog-core.js";

const providers = Object.freeze({
  "moshi-moshi-yusuke": { channelId: "UCcCeJ3pQYFgvfVuMxVRWhoA", defaultLevel: "Native" },
  "natural-japanese": { channelId: "UCXo8kuCtqLjL1EH6m4FJJNA", defaultLevel: "Beginner–Advanced" },
  "cure-dolly": { channelId: "UCkdmU8hGK4Fg3LghTVtKltQ", defaultLevel: "Archived reference" },
});

export const revalidate = 3600;

export async function GET(_request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const config = providers[provider as keyof typeof providers];
  if (!config) return Response.json({ error: "Unknown immersion provider" }, { status: 404 });
  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.channelId}`;
    const response = await fetch(feedUrl, { next: { revalidate } });
    if (!response.ok) return Response.json({ error: "Provider catalog unavailable" }, { status: 502 });
    const catalog = parseYouTubeVideoFeed(await response.text(), { sourceId: provider, defaultLevel: config.defaultLevel }).slice(0, 20);
    return Response.json(catalog, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ error: "Provider catalog unavailable" }, { status: 502 });
  }
}
