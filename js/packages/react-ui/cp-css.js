import fs from "fs";
import { camelCase } from "lodash-es";
import path from "path";

const dirname = path.dirname(new URL(import.meta.url).pathname);

// Create directories if they don't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Copy CSS files from src to dist
function copyCssFiles() {
  const srcDir = path.join(dirname, "dist", "components");
  const distDir = path.join(dirname, "dist", "styles");

  // Ensure the dist/styles directory exists
  ensureDirectoryExists(distDir);

  // Read all component directories
  const components = fs.readdirSync(srcDir);

  components.forEach((component) => {
    const componentSrcPath = path.join(srcDir, component);
    const componentStylesheetName = `${camelCase(component)}.css`;

    // Skip if not a directory
    if (!fs.statSync(componentSrcPath).isDirectory()) {
      return;
    }

    const stylePath = path.join(componentSrcPath, componentStylesheetName);
    const distFile = path.join(distDir, componentStylesheetName);
    if (fs.existsSync(stylePath)) {
      fs.copyFileSync(stylePath, distFile);
    } else {
      console.warn(`No stylesheet found for ${component}`);
    }
  });

  const indexCSSContent = fs.readFileSync(path.join(srcDir, "index.css"), "utf8");
  fs.writeFileSync(path.join(distDir, "index.css"), indexCSSContent);
}

try {
  copyCssFiles();
  console.log("CSS files copied successfully!");
} catch (error) {
  console.error("Error copying CSS files:", error);
  process.exit(1);
}
