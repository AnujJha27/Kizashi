import { parseTeppeiFeed } from "@/lib/teppei-catalog-core.js";

const FEED_URL = "https://nihongoconteppei.com/feed/";

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(FEED_URL, { next: { revalidate } });
    if (!response.ok) return Response.json({ error: "Teppei catalog unavailable" }, { status: 502 });
    const catalog = parseTeppeiFeed(await response.text()).slice(0, 20);
    return Response.json(catalog, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ error: "Teppei catalog unavailable" }, { status: 502 });
  }
}
