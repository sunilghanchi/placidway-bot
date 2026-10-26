import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const urls = [
  "https://www.placidway.com/profile/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center",
  "https://www.placidway.com/package/7903/Alternative-Adenocarcinoma-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC",
  "https://www.placidway.com/package/7902/Alternative-Adrenal-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC",
  "https://www.placidway.com/package/7901/Alternative-Anal-Cancer-Treatment-Package-in-Tijuana-Mexico-by-ITC",
  "https://www.placidway.com/profile-videos/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center",
  "https://www.placidway.com/price-list/5/Alternative-Cancer-Treatment-by-ITC-Immunity-Therapy-Center",
  "https://www.placidway.com/search-medical-pricings/Alternative-Medicine/All/1"
];

const sleep = ms => new Promise(resolvePromise => setTimeout(resolvePromise, ms));
const strip = html => html
  .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, " ")
  .trim();

const pages = [];
for (let index = 0; index < urls.length; index += 1) {
  const url = urls[index];
  const response = await fetch(url, { headers: { "User-Agent": "PlacidWayAssessmentBot/1.0 (+assessment; contact: candidate)" } });
  if (!response.ok) throw new Error(`${response.status} while fetching ${url}`);
  pages.push({ url, fetchedAt: new Date().toISOString(), text: strip(await response.text()) });
  if (index < urls.length - 1) await sleep(1100);
}

await writeFile(resolve("data/raw-pages.json"), JSON.stringify({ generatedAt: new Date().toISOString(), pages }, null, 2));
console.log(`Fetched ${pages.length} allowlisted pages to data/raw-pages.json`);
