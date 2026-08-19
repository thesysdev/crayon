const WINDOW_NAME = "openui-debug";
const ROOT_ID = "openui-debug-root";

export function debugMountNode(popup: Window): HTMLElement | null {
  return popup.document.getElementById(ROOT_ID);
}

/**
 * Open (or focus) a named same-origin window and copy host styles into it.
 * Must run inside a click handler. Do not pass `noopener` — we need the Window.
 */
export function openDebugWindow(): Window | null {
  if (typeof window === "undefined") return null;
  const width = Math.max(640, Math.min(window.screen?.availWidth ?? 1280, 1600));
  const height = Math.max(480, Math.min(window.screen?.availHeight ?? 800, 1000));
  const popup = window.open("", WINDOW_NAME, `popup=yes,width=${width},height=${height}`);
  if (!popup) return null;
  prepareDebugDocument(document, popup.document);
  popup.focus();
  return popup;
}

function prepareDebugDocument(from: Document, to: Document): void {
  if (to.documentElement.dataset["openuiDebug"] === "true") return;
  to.documentElement.dataset["openuiDebug"] = "true";
  to.title = "OpenUI Debug";
  // Mirror the host's root classes/attrs/color-scheme so the rendered preview
  // resolves the same CSS it would in the app. Devtools chrome is unaffected —
  // it uses the mode chosen in Settings.
  to.documentElement.className = from.documentElement.className;
  to.body.className = from.body.className;
  copyAttributes(from.documentElement, to.documentElement);
  copyAttributes(from.body, to.body);
  const colorScheme = getComputedStyle(from.documentElement).colorScheme;
  if (colorScheme) to.documentElement.style.colorScheme = colorScheme;

  for (const node of from.head.querySelectorAll("link[rel='stylesheet'], style")) {
    to.head.appendChild(node.cloneNode(true));
  }

  const fromSheets = from.adoptedStyleSheets;
  if (fromSheets && fromSheets.length > 0) {
    try {
      to.adoptedStyleSheets = [...fromSheets];
    } catch {
      // Some browsers reject cross-document adoptedStyleSheets.
    }
  }

  to.documentElement.style.height = "100%";
  to.body.style.margin = "0";
  to.body.style.height = "100%";

  const root = to.createElement("div");
  root.id = ROOT_ID;
  root.style.height = "100%";
  to.body.appendChild(root);
}

function copyAttributes(from: Element, to: Element): void {
  for (const attr of from.attributes) {
    if (attr.name === "class") continue;
    to.setAttribute(attr.name, attr.value);
  }
}
