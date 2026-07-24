import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(packageDir, "dist");

function walkFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function isExternalSource(source) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(source) || source.startsWith("\0");
}

if (!fs.existsSync(distDir)) {
  throw new Error(`Cannot prepare source maps because ${distDir} does not exist`);
}

let mapCount = 0;
let mapsWithEmbeddedSources = 0;
let embeddedSourceBytes = 0;
const missingSources = [];
const distFiles = walkFiles(distDir);
const developmentArtifacts = distFiles.filter((filePath) =>
  /(?:^|[/\\])(?:stories|__tests__|__test-helpers)(?:[/\\]|$)|\.(?:stories|test|spec)\./.test(
    filePath,
  ),
);

if (developmentArtifacts.length > 0) {
  throw new Error(
    `Development-only files were emitted into dist:\n${developmentArtifacts
      .map((filePath) => path.relative(packageDir, filePath))
      .join("\n")}`,
  );
}

for (const mapPath of distFiles.filter((filePath) => filePath.endsWith(".map"))) {
  const sourceMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  mapCount += 1;

  if (Array.isArray(sourceMap.sourcesContent)) {
    mapsWithEmbeddedSources += 1;
    embeddedSourceBytes += sourceMap.sourcesContent.reduce(
      (total, source) => total + Buffer.byteLength(source ?? ""),
      0,
    );
    delete sourceMap.sourcesContent;
  }

  const sourceRoot = sourceMap.sourceRoot ?? "";
  for (const source of sourceMap.sources ?? []) {
    const sourceReference = `${sourceRoot}${source}`;
    if (isExternalSource(sourceReference)) continue;

    const resolvedSource = path.resolve(path.dirname(mapPath), sourceRoot, source);
    if (!fs.existsSync(resolvedSource)) {
      missingSources.push(
        `${path.relative(packageDir, mapPath)} -> ${path.relative(packageDir, resolvedSource)}`,
      );
    }
  }

  fs.writeFileSync(mapPath, `${JSON.stringify(sourceMap)}\n`);
}

if (missingSources.length > 0) {
  throw new Error(`Source maps reference missing source files:\n${missingSources.join("\n")}`);
}

console.log(
  `Prepared ${mapCount} source maps; removed ${embeddedSourceBytes} embedded source bytes from ${mapsWithEmbeddedSources} maps.`,
);
