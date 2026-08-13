import { synchronizeRepository } from "./model-policy.mjs";

const args = new Set(process.argv.slice(2));
const supportedArgs = new Set(["--check"]);
const unknownArgs = [...args].filter((arg) => !supportedArgs.has(arg));

if (unknownArgs.length > 0) {
  console.error(`Unknown argument(s): ${unknownArgs.join(", ")}`);
  process.exit(2);
}

const check = args.has("--check");
const { changes, references, policy } = synchronizeRepository({ write: !check });

if (references === 0) {
  console.error("No managed model references were found. Check the configured scopes.");
  process.exit(1);
}

if (changes.length === 0) {
  console.log(`Model policy is synchronized across ${references} references.`);
  process.exit(0);
}

if (!check) {
  console.log(`Synchronized model policy in ${changes.length} file(s):`);
  for (const { filePath } of changes) console.log(`  - ${filePath}`);
  process.exit(0);
}

console.error("Model policy is out of sync:");
for (const { filePath, role } of changes) {
  const variants = Object.values(policy.roles[role].variants).join(", ");
  console.error(`  - ${filePath}`);
  console.error(`    expected ${role}: ${variants}`);
}
console.error("\nRun `pnpm models:sync` and commit the resulting changes.");
process.exit(1);
