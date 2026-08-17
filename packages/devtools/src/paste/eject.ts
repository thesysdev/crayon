const WINDOW_NAME = "openui-paste";
const ROOT_ID = "openui-paste-root";

export function pasteMountNode(popup: Window): HTMLElement | null {
  return popup.document.getElementById(ROOT_ID);
}

/**
 * Open (or focus) a named same-origin window and copy host styles into it.
 * Must run inside a click handler. Do not pass `noopener` — we need the Window.
 */
export function openPasteWindow(): Window | null {
  if (typeof window === "undefined") return null;
  const width = Math.max(640, Math.min(window.screen?.availWidth ?? 1280, 1600));
  const height = Math.max(480, Math.min(window.screen?.availHeight ?? 800, 1000));
  const popup = window.open("", WINDOW_NAME, `popup=yes,width=${width},height=${height}`);
  if (!popup) return null;
  preparePasteDocument(document, popup.document);
  popup.focus();
  return popup;
}

function preparePasteDocument(from: Document, to: Document): void {
  if (to.documentElement.dataset["openuiPaste"] === "true") return;
  to.documentElement.dataset["openuiPaste"] = "true";
  to.title = "OpenUI Paste";
  to.documentElement.className = from.documentElement.className;
  to.body.className = from.body.className;
  const rootStyle = from.documentElement.getAttribute("style");
  if (rootStyle) to.documentElement.setAttribute("style", rootStyle);

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
