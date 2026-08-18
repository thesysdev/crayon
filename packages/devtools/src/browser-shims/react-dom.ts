// Stands in for the bare "react-dom" specifier (OpenUIDevtools.tsx's
// createPortal, used to eject Paste into its own popup window). Same
// load-order guarantee as browser-shims/react.ts.
import { requireCreatePortal } from "./slots";

export const createPortal = requireCreatePortal();
