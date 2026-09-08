const providers = Object.freeze([
  { id: "japanese-with-shun", name: "Japanese with Shun", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCu6sZrHyl4hSS2PvlUo2XZA" },
  { id: "moshi-moshi-yusuke", name: "もしもしゆうすけ", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcCeJ3pQYFgvfVuMxVRWhoA" },
  { id: "natural-japanese", name: "Natural Japanese", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXo8kuCtqLjL1EH6m4FJJNA" },
  { id: "cure-dolly", name: "Organic Japanese with Cure Dolly", feed: "https://www.youtube.com/feeds/videos.xml?channel_id=UCkdmU8hGK4Fg3LghTVtKltQ" },
]);

export const revalidate = 900;
export const dynamic = "force-dynamic";

export async function GET() {
  const health = await Promise.all(providers.map(async (provider) => {
    try {
      const response = await fetch(provider.feed, { next: { revalidate }, signal: AbortSignal.timeout(5000) });
      return { id: provider.id, name: provider.name, status: response.ok ? "healthy" : "unavailable", httpStatus: response.status };
    } catch {
      return { id: provider.id, name: provider.name, status: "unavailable", httpStatus: null };
    }
  }));
  return Response.json(health, { headers: { "Cache-Control": "public, max-age=900, stale-while-revalidate=3600" } });
}
