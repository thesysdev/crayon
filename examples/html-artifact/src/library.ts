import { createLibrary, type PromptOptions } from "@openuidev/react-lang";
import { HtmlArtifact } from "./html-artifact";

export const library = createLibrary({
  root: "HtmlArtifact",
  components: [HtmlArtifact],
});

export const promptOptions: PromptOptions = {
  additionalRules: [
    "Generate a self-contained HTML/CSS/JavaScript experience in the document argument.",
    "The document may be a complete HTML document or an HTML fragment.",
    "Use inline CSS and JavaScript. Do not depend on external scripts, stylesheets, fonts, images, or network requests.",
    "Do not wrap the document in Markdown fences.",
    "Keep the root statement on one line. Encode line breaks as \\n inside the document string.",
    "The document is a double-quoted openui-lang string. Prefer single quotes inside HTML and JavaScript, and escape any double quotes or backslashes.",
  ],
  examples: [
    `root = HtmlArtifact("Interactive counter", "<!doctype html><html><head><style>body{font-family:system-ui;padding:2rem}button{padding:.5rem 1rem}</style></head><body><h1>Counter</h1><button id='count'>0</button><script>let count=0;document.querySelector('#count').addEventListener('click',event=>{event.currentTarget.textContent=String(++count)})</script></body></html>")`,
  ],
};
