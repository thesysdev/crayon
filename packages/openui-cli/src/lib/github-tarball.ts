import * as fs from "node:fs";
import * as path from "node:path";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const TAR_BLOCK = 512;
const DEFAULT_REF = "main";

/** Download a public GitHub subdirectory from the repo tarball. */
export async function downloadGithubSubdir(options: {
  repo: string;
  subdir: string;
  destDir: string;
  ref?: string;
  timeoutMs: number;
}): Promise<void> {
  const ref = options.ref?.trim() || DEFAULT_REF;
  const subdir = options.subdir.replace(/^\/+/, "").replace(/\/+$/, "");
  const url = `https://codeload.github.com/${options.repo}/tar.gz/${ref}`;

  const response = await fetch(url, {
    headers: { "User-Agent": "openui-cli" },
    signal: AbortSignal.timeout(options.timeoutMs),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(
        "Download timed out. This may be due to GitHub rate limiting or a network issue.",
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to download ${url}: ${message}`, { cause: error });
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }
  if (!response.body) {
    throw new Error(`Failed to download ${url}: empty response body`);
  }

  fs.mkdirSync(options.destDir, { recursive: true });
  await pipeline(
    Readable.fromWeb(response.body as import("node:stream/web").ReadableStream<Uint8Array>),
    createGunzip(),
    new TarSubdirExtractor(options.destDir, subdir),
  );
}

type DataState = {
  kind: "data";
  remaining: number;
  padded: number;
  chunks: Buffer[];
  onComplete: (data: Buffer) => void;
};

class TarSubdirExtractor extends Writable {
  private leftover: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  private pending: { kind: "header" } | DataState = { kind: "header" };
  private nextPath: string | undefined;

  constructor(
    private readonly destDir: string,
    private readonly subdir: string,
  ) {
    super();
  }

  override _write(
    chunk: Buffer | Uint8Array,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    try {
      this.consume(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  override _final(callback: (error?: Error | null) => void) {
    try {
      if (this.pending.kind === "data") throw new Error("Truncated GitHub archive");
      callback();
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private consume(chunk: Buffer) {
    this.leftover = this.leftover.length === 0 ? chunk : Buffer.concat([this.leftover, chunk]);

    for (;;) {
      if (this.pending.kind === "header") {
        if (this.leftover.length < TAR_BLOCK) return;
        const header = this.leftover.subarray(0, TAR_BLOCK);
        this.leftover = this.leftover.subarray(TAR_BLOCK);
        if (isZeroBlock(header)) continue;
        this.beginEntry(parseTarHeader(header));
        continue;
      }

      if (this.leftover.length === 0) return;
      const take = Math.min(this.leftover.length, this.pending.padded);
      const slice = this.leftover.subarray(0, take);
      this.leftover = this.leftover.subarray(take);
      const dataBytes = Math.min(slice.length, this.pending.remaining);
      if (dataBytes > 0) this.pending.chunks.push(slice.subarray(0, dataBytes));
      this.pending.remaining -= dataBytes;
      this.pending.padded -= take;
      if (this.pending.padded > 0) return;
      this.pending.onComplete(Buffer.concat(this.pending.chunks));
      this.pending = { kind: "header" };
    }
  }

  private beginEntry(header: TarHeader) {
    const type = header.type;
    const size = header.size;
    const name = this.nextPath ?? header.name;
    this.nextPath = undefined;

    if (type === "x" || type === "g") {
      this.readData(size, (data) => {
        if (type !== "x") return;
        const paxPath = parsePaxPath(data);
        if (paxPath) this.nextPath = paxPath;
      });
      return;
    }

    const relative = relativeToSubdir(stripArchiveRoot(name), this.subdir);
    if (!relative || relative === ".") {
      this.readData(size, () => undefined);
      return;
    }

    const dest = resolveSafePath(this.destDir, relative);
    if (!dest) {
      this.readData(size, () => undefined);
      return;
    }

    if (type === "5") {
      fs.mkdirSync(dest, { recursive: true });
      this.readData(size, () => undefined);
      return;
    }

    if (type === "0" || type === "\0") {
      this.readData(size, (data) => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, data, { mode: header.mode || 0o644 });
      });
      return;
    }

    this.readData(size, () => undefined);
  }

  private readData(size: number, onComplete: (data: Buffer) => void) {
    const padded = Math.ceil(size / TAR_BLOCK) * TAR_BLOCK;
    if (padded === 0) {
      onComplete(Buffer.alloc(0));
      this.pending = { kind: "header" };
      return;
    }
    this.pending = { kind: "data", remaining: size, padded, chunks: [], onComplete };
  }
}

type TarHeader = {
  name: string;
  size: number;
  mode: number;
  type: string;
};

function parseTarHeader(block: Buffer): TarHeader {
  const name = readCString(block, 0, 100);
  const prefix = readCString(block, 345, 155);
  return {
    name: prefix ? `${prefix}/${name}` : name,
    size: parseOctal(block, 124, 12),
    mode: parseOctal(block, 100, 8) & 0o777,
    type: String.fromCharCode(block[156] ?? 0),
  };
}

function readCString(block: Buffer, offset: number, length: number): string {
  const slice = block.subarray(offset, offset + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? length : end).toString("utf8");
}

function parseOctal(block: Buffer, offset: number, length: number): number {
  const text = block
    .subarray(offset, offset + length)
    .toString("utf8")
    .replace(/\0.*$/, "")
    .trim();
  return text ? Number.parseInt(text, 8) : 0;
}

function isZeroBlock(block: Buffer): boolean {
  for (let i = 0; i < block.length; i += 1) {
    if (block[i] !== 0) return false;
  }
  return true;
}

function parsePaxPath(data: Buffer): string | undefined {
  const text = data.toString("utf8");
  let offset = 0;
  while (offset < text.length) {
    const space = text.indexOf(" ", offset);
    if (space < 0) break;
    const length = Number.parseInt(text.slice(offset, space), 10);
    if (!Number.isFinite(length) || length <= 0) break;
    const body = text.slice(space + 1, offset + length);
    const eq = body.indexOf("=");
    if (eq !== -1 && body.slice(0, eq) === "path") {
      return body.slice(eq + 1).replace(/\n$/, "");
    }
    offset += length;
  }
  return undefined;
}

/** GitHub tarballs nest files under `<owner>-<repo>-<sha>/`. */
function stripArchiveRoot(entryPath: string): string {
  return entryPath.split("/").slice(1).join("/");
}

function relativeToSubdir(entryPath: string, subdir: string): string | undefined {
  const normalized = entryPath.replaceAll("\\", "/").replace(/^\/+/, "");
  if (normalized === subdir) return ".";
  if (normalized.startsWith(`${subdir}/`)) return normalized.slice(subdir.length + 1);
  return undefined;
}

function resolveSafePath(root: string, relative: string): string | undefined {
  const rootDir = path.resolve(root);
  const resolved = path.resolve(rootDir, relative);
  const prefix = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;
  if (resolved !== rootDir && !resolved.startsWith(prefix)) return undefined;
  return resolved;
}
