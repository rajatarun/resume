#!/usr/bin/env node
/**
 * Fetches the travel journal for /traveller, at build time.
 *
 * The journal lives in the content API (rajatarun/ai-content-orchestrator),
 * uploaded from Admin -> Content -> Travel journal. GET /site/travel is its
 * public view: trips with places, summaries, highlights and Instagram links,
 * and no dates in any form. This writes it to data/travel/generated/, which
 * lib/travel/load.ts reads while the page is pre-rendered.
 *
 * Never fails the build. Without NEXT_PUBLIC_API_BASE_URL, or when the API
 * cannot be reached, it keeps the last copy if there is one, else writes an
 * empty journal: /traveller still builds, with the heat-map places only.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "data", "travel", "generated", "site-travel.json");

async function keepOrEmpty(reason) {
  try {
    await readFile(OUT, "utf8");
    console.warn(`[sync:travel] ${reason}; keeping the last copy at ${path.relative(process.cwd(), OUT)}`);
  } catch {
    await writeFile(OUT, `${JSON.stringify({ trips: [] }, null, 2)}\n`, "utf8");
    console.warn(`[sync:travel] ${reason}; /traveller will show the heat-map places only`);
  }
}

await mkdir(path.dirname(OUT), { recursive: true });
const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

if (!base) {
  await keepOrEmpty("NEXT_PUBLIC_API_BASE_URL is not set");
} else {
  try {
    const response = await fetch(`${base}/site/travel`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (!body || !Array.isArray(body.trips)) throw new Error("response has no trips list");
    await writeFile(OUT, `${JSON.stringify(body, null, 2)}\n`, "utf8");
    console.log(`[sync:travel] ${body.trips.length} trips -> ${path.relative(process.cwd(), OUT)}`);
  } catch (error) {
    await keepOrEmpty(`could not read ${base}/site/travel (${error.message})`);
  }
}
