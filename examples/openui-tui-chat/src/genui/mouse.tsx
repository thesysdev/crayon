import { appendFileSync } from "node:fs";
import { Box, measureElement, useStdin, useStdout, type DOMElement } from "ink";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";

// Click-only SGR mouse tracking (?1000) + SGR extended coords (?1006). We use
// click-only (not all-motion ?1003) to avoid flooding stdin on every move.
const SGR_ENABLE = "\u001B[?1000h\u001B[?1006h";
const SGR_DISABLE = "\u001B[?1000l\u001B[?1006l";
// Press events end with "M"; release with "m". We only act on press.
const PRESS_RE = /\u001B\[<(\d+);(\d+);(\d+)M/g;

const DEBUG = process.env.TUI_MOUSE_DEBUG === "1";

interface Zone {
  ref: RefObject<DOMElement | null>;
  onClick: () => void;
}

interface MouseContextValue {
  register: (zone: Zone) => () => void;
}

const MouseContext = createContext<MouseContextValue | null>(null);

/** Position of a node relative to `rootNode`, by summing Yoga offsets up the tree. */
function positionRelativeTo(node: DOMElement, rootNode: DOMElement | null) {
  const yoga = (node as unknown as { yogaNode?: any }).yogaNode;
  const rootYoga = (rootNode as unknown as { yogaNode?: any } | null)?.yogaNode;
  if (!yoga) return null;
  let left = 0;
  let top = 0;
  let current: any = yoga;
  while (current && current !== rootYoga) {
    left += current.getComputedLeft?.() ?? 0;
    top += current.getComputedTop?.() ?? 0;
    current = current.getParent?.();
  }
  return {
    left,
    top,
    width: yoga.getComputedWidth?.() ?? 0,
    height: yoga.getComputedHeight?.() ?? 0,
  };
}

/**
 * Enables click-only mouse tracking once, parses press events from stdin, and
 * dispatches to the topmost registered zone. `rootRef` must point at the
 * bottom-anchored dynamic region so we can map absolute screen rows to it.
 */
export function MouseProvider({
  rootRef,
  children,
}: {
  rootRef: RefObject<DOMElement | null>;
  children: ReactNode;
}) {
  const { stdin, setRawMode, isRawModeSupported } = useStdin();
  const { stdout } = useStdout();
  const zones = useRef<Set<Zone>>(new Set());

  const register = useCallback((zone: Zone) => {
    zones.current.add(zone);
    return () => {
      zones.current.delete(zone);
    };
  }, []);

  useEffect(() => {
    if (!stdin || !isRawModeSupported) return;
    setRawMode(true);
    stdout.write(SGR_ENABLE);

    const dispatch = (cx: number, cy: number) => {
      const rows = stdout.rows ?? 24;
      const height = rootRef.current ? measureElement(rootRef.current).height : 0;
      // The live region's last line (composer) sits at the bottom of the terminal
      // output, so its top screen row is (rows - height). This is correct once the
      // content fills the screen (including long forms); for a short exchange it's
      // approximate, so keyboard remains the exact path there.
      const offsetY = height > 0 ? rows - height : 0;

      let hit: Zone | null = null;
      let hitInfo = "miss";
      for (const zone of zones.current) {
        const node = zone.ref.current;
        if (!node) continue;
        const p = positionRelativeTo(node, rootRef.current);
        if (!p) continue;
        const top = p.top + offsetY;
        if (DEBUG) hitInfo += ` | zone[l${p.left},t${top},w${p.width},h${p.height}]`;
        if (cx >= p.left && cx < p.left + p.width && cy >= top && cy < top + p.height) {
          hit = zone;
          hitInfo = `hit@[l${p.left},t${top},w${p.width},h${p.height}]`;
          break;
        }
      }

      if (DEBUG) {
        try {
          appendFileSync("/tmp/mouse-debug.log", `click(${cx},${cy}) rows=${rows} offY=${offsetY} ${hitInfo}\n`);
        } catch {
          // ignore
        }
      }
      if (hit) hit.onClick();
    };

    const onData = (data: Buffer) => {
      const s = data.toString("utf8");
      PRESS_RE.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = PRESS_RE.exec(s)) !== null) {
        const cb = Number(m[1]);
        if ((cb & 3) !== 0 || (cb & 64) !== 0) continue; // left-button presses only
        dispatch(Number(m[2]) - 1, Number(m[3]) - 1);
      }
    };

    stdin.on("data", onData);
    const cleanupOnExit = () => stdout.write(SGR_DISABLE);
    process.once("exit", cleanupOnExit);

    return () => {
      stdin.off("data", onData);
      stdout.write(SGR_DISABLE);
      process.off("exit", cleanupOnExit);
    };
  }, [stdin, setRawMode, isRawModeSupported, stdout, rootRef]);

  return <MouseContext.Provider value={{ register }}>{children}</MouseContext.Provider>;
}

/**
 * True for ordinary typed text; false for escape/control/mouse sequences that
 * land on the same stdin when mouse tracking is enabled.
 */
export function isTypedText(input: string): boolean {
  if (!input) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(input)) return false; // control chars incl. ESC
  if (input.includes("[<")) return false; // SGR mouse marker (ESC already stripped)
  return true;
}

/** Register a click zone for the given ref. No-op when there is no MouseProvider. */
export function useClickable(ref: RefObject<DOMElement | null>, onClick: () => void) {
  const ctx = useContext(MouseContext);
  const cbRef = useRef(onClick);
  cbRef.current = onClick;
  useEffect(() => {
    if (!ctx) return;
    return ctx.register({ ref, onClick: () => cbRef.current() });
  }, [ctx, ref]);
}

/** Wrap children in a Box that fires `onClick` when clicked (mouse). */
export function Clickable({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const ref = useRef<DOMElement>(null);
  useClickable(ref, onClick);
  return <Box ref={ref}>{children}</Box>;
}
