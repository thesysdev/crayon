import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRegisteredLibraries, type DevtoolsConfig } from "../lib";
import type { ColorMode } from "../theme";
import { DebugUI } from "./DebugUI";
import { debugMountNode, openDebugWindow } from "./eject";

/**
 * Session for OpenUI Debug: editor contents, registered libraries, tray vs
 * ejected window. Inspect stays independent — this hook never opens or closes
 * that tray. Escape / the shared scrim should call `retract` (tray only);
 * Debug's own close button calls `close` (tray and popup).
 */
export function useDebug({
  theme,
  helpSeen,
  editorPct,
  setConfig,
}: {
  theme: ColorMode;
  helpSeen: boolean;
  editorPct: number;
  setConfig: (patch: Partial<DevtoolsConfig>) => void;
}): {
  trayOpen: boolean;
  canOpen: boolean;
  openWith: (response: string, libraryId?: string) => void;
  close: () => void;
  retract: () => void;
  view: ReactNode;
  portal: ReactNode;
} {
  const libraries = useRegisteredLibraries();
  const [trayOpen, setTrayOpen] = useState(false);
  const [popup, setPopup] = useState<Window | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [code, setCode] = useState("");
  const [libraryId, setLibraryId] = useState<string | undefined>();
  const markHelpSeen = useCallback(() => setConfig({ helpSeen: true }), [setConfig]);

  useEffect(() => {
    if (!popup) return;
    const onGone = () => setPopup(null);
    popup.addEventListener("pagehide", onGone);
    return () => popup.removeEventListener("pagehide", onGone);
  }, [popup]);

  const close = useCallback(() => {
    if (popup) {
      popup.close();
      setPopup(null);
    }
    setTrayOpen(false);
    setPopupBlocked(false);
  }, [popup]);

  const retract = useCallback(() => setTrayOpen(false), []);

  const eject = useCallback(() => {
    const next = openDebugWindow();
    if (!next) {
      setPopupBlocked(true);
      return;
    }
    setPopupBlocked(false);
    setPopup(next);
    setTrayOpen(false);
  }, []);

  const minimize = useCallback(() => {
    if (popup) {
      popup.close();
      setPopup(null);
    }
    setPopupBlocked(false);
    setTrayOpen(true);
  }, [popup]);

  const open = useCallback(() => {
    setPopupBlocked(false);
    if (popup && !popup.closed) {
      popup.focus();
      return;
    }
    if (popup) setPopup(null);
    setTrayOpen(true);
  }, [popup]);

  const openWith = useCallback(
    (response: string, nextLibraryId?: string) => {
      setCode(response);
      setLibraryId(nextLibraryId);
      open();
    },
    [open],
  );

  const view = (
    <DebugUI
      libraries={libraries}
      code={code}
      onCodeChange={setCode}
      libraryId={libraryId}
      editorPct={editorPct}
      onEditorPctChange={(pct) => setConfig({ editorPct: pct })}
      ejected={Boolean(popup)}
      onEject={eject}
      onMinimize={minimize}
      onClose={close}
      theme={theme}
      onThemeChange={(next) => setConfig({ theme: next })}
      helpSeen={helpSeen}
      onHelpSeen={markHelpSeen}
      popupBlocked={popupBlocked}
    />
  );
  const popupRoot = popup ? debugMountNode(popup) : null;

  return {
    trayOpen,
    canOpen: libraries.length > 0,
    openWith,
    close,
    retract,
    view,
    portal: popupRoot ? createPortal(view, popupRoot) : null,
  };
}
