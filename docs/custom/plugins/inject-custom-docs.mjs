// @ts-check
import path from "path";
import fs from "fs";

/**
 * @param app {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  app.renderer.markdownHooks.on("page.begin", (page) => {
    const dirname = path.dirname(new URL(import.meta.url).pathname);
    const customFilePath = page.page.filename.split("/").slice(-5).join("/"); // -5 because we want the path starting from the reference directory
    const filePath = path.resolve(
      dirname,
      "..",
      customFilePath
    );
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf-8");
    }
  });
}
