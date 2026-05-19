import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const NPM_SCOPE = "openuidev";
const README_PATH = resolve("README.md");
const END_DATE = new Date().toISOString().slice(0, 10);
const MAX_WINDOW_DAYS = 365;

async function getJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }

  return response.json();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}

async function getScopedPackages() {
  const searchUrl = new URL("https://registry.npmjs.org/-/v1/search");
  searchUrl.searchParams.set("text", `@${NPM_SCOPE}`);
  searchUrl.searchParams.set("size", "250");

  const results = await getJson(searchUrl);

  return results.objects
    .map((result) => result.package.name)
    .filter((name) => name.startsWith(`@${NPM_SCOPE}/`))
    .sort();
}

async function getPackageCreatedDate(packageName) {
  const metadata = await getJson(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}`,
  );

  return metadata.time.created.slice(0, 10);
}

async function getPackageDownloads(packageName, startDate, endDate) {
  let total = 0;
  let currentStart = new Date(`${startDate}T00:00:00.000Z`);
  const finalEnd = new Date(`${endDate}T00:00:00.000Z`);
  const encodedName = encodeURIComponent(packageName);

  while (currentStart <= finalEnd) {
    const currentEnd = new Date(
      Math.min(addDays(currentStart, MAX_WINDOW_DAYS - 1), finalEnd),
    );
    const range = `${toDateString(currentStart)}:${toDateString(currentEnd)}`;
    const downloads = await getJson(
      `https://api.npmjs.org/downloads/point/${range}/${encodedName}`,
    );

    total += downloads.downloads ?? 0;
    currentStart = addDays(currentEnd, 1);
  }

  return total;
}

async function main() {
  const packages = await getScopedPackages();

  if (packages.length === 0) {
    throw new Error(`No @${NPM_SCOPE} packages found on npm.`);
  }

  let totalDownloads = 0;

  for (const packageName of packages) {
    const createdDate = await getPackageCreatedDate(packageName);
    totalDownloads += await getPackageDownloads(
      packageName,
      createdDate,
      END_DATE,
    );
  }

  const badgeUrl = `https://img.shields.io/badge/npm%20downloads-${encodeURIComponent(
    totalDownloads.toLocaleString("en-US"),
  )}-CB3837?logo=npm&logoColor=white`;
  const badgeMarkdown = `[![npm downloads](${badgeUrl})](https://www.npmjs.com/search?q=%40openuidev)`;
  const readme = await readFile(README_PATH, "utf8");
  const markdownBadgePattern =
    /^\[!\[npm downloads\]\(.+\)\]\(https:\/\/www\.npmjs\.com\/search\?q=%40openuidev\)$/m;
  const htmlBadgePattern =
    /<img alt="npm downloads" src="https:\/\/img\.shields\.io\/badge\/npm%20downloads-[^"]+">/;
  const htmlBadge = `<img alt="npm downloads" src="${badgeUrl}">`;

  if (htmlBadgePattern.test(readme)) {
    await writeFile(README_PATH, readme.replace(htmlBadgePattern, htmlBadge));
    return;
  }

  if (!markdownBadgePattern.test(readme)) {
    throw new Error("Could not find npm downloads badge in README.md.");
  }

  const updatedReadme = readme.replace(markdownBadgePattern, badgeMarkdown);
  await writeFile(README_PATH, updatedReadme);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
