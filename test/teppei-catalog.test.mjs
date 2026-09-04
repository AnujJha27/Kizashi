import test from "node:test";
import assert from "node:assert/strict";

import { parseTeppeiFeed, rotateCatalog } from "../lib/teppei-catalog-core.js";

test("Teppei RSS entries retain provider metadata and remote audio", () => {
  const catalog = parseTeppeiFeed(`<rss><channel><item><guid>teppei-1576</guid><title>#1576「やっとルーティンに戻った！」</title><pubDate>Thu, 03 Sep 2026 00:00:00 +0000</pubDate><link>https://nihongoconteppei.com/?p=1576</link><enclosure url="http://media.blubrry.com/nihongo_con_teppei/p/nihongoconteppei.com/wp-content/uploads/2026/09/Beginners-con-Teppei1576.mp3" type="audio/mpeg"/><itunes:duration>12:34</itunes:duration></item></channel></rss>`);
  assert.equal(catalog.length, 1);
  assert.equal(catalog[0].id, "teppei-1576");
  assert.equal(catalog[0].title, "#1576「やっとルーティンに戻った！」");
  assert.equal(catalog[0].publishedAt, "2026-09-03T00:00:00.000Z");
  assert.equal(catalog[0].url, "https://nihongoconteppei.com/?p=1576");
  assert.equal(catalog[0].mediaUrl.startsWith("https://"), true);
  assert.equal(catalog[0].duration, "12:34");
  assert.equal(rotateCatalog(catalog, 1)[0].id, "teppei-1576");
  assert.equal(parseTeppeiFeed(`<rss><item><title>bad</title><enclosure url="javascript:alert(1)"/></item></rss>`).length, 0);
});
