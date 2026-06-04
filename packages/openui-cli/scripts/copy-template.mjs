import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const source = resolve(packageRoot, "src/templates/openui-chat");
const templatesDir = resolve(packageRoot, "dist/templates");
const destination = resolve(templatesDir, "openui-chat");

rmSync(destination, { recursive: true, force: true });
mkdirSync(templatesDir, { recursive: true });
cpSync(source, destination, { recursive: true });
