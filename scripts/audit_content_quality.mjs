import { readFile } from "node:fs/promises";

import { buildContentQualityReport } from "../lib/content-quality-core.js";

const [readingPath = "data/original-reading-bank.json", listeningPath = "data/original-listening-bank.json"] = process.argv.slice(2);
const [reading, listening] = await Promise.all([readingPath, listeningPath].map(async (path) => JSON.parse(await readFile(path, "utf8"))));

console.log(JSON.stringify(buildContentQualityReport({ readings: reading.readings, listening: listening.listening }), null, 2));
