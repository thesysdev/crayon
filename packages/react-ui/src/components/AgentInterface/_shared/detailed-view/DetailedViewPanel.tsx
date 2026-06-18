import { useDetailedView, useDetailedViewPortalTarget } from "@openuidev/react-headless";
import clsx from "clsx";
import { X } from "lucide-react";
import { Component, forwardRef, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "../../../IconButton";
import { useTheme } from "../../../ThemeProvider/ThemeProvider";

/** @internal */
type DetailedViewErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type DetailedViewErrorBoundaryState = {
  hasError: boolean;
};

/** @internal */
class DetailedViewErrorBoundary extends Component<
  DetailedViewErrorBoundaryProps,
  DetailedViewErrorBoundaryState
> {
  constructor(props: DetailedViewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): DetailedViewErrorBoundaryState {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

/**
 * Props for {@link DetailedViewPanel}.
 *
 * @category Components
 */
export type DetailedViewPanelProps = {
  /** Detailed-view id this panel renders content for. Must match the id passed to `useDetailedView(viewId)`. */
  viewId: string;
  /** Content rendered inside the panel when this view is active. */
  children: ReactNode;
  /** Display title for the panel header and aria-label. Defaults to `"Detailed view"`. */
  title?: string;
  /** Additional CSS class name(s) applied to the panel container. */
  className?: string;
  /** Fallback UI rendered if children throw during rendering. Defaults to `null`. */
  errorFallback?: ReactNode;
  /**
   * Controls the panel header.
   * - `true` (default): built-in header with title + close button
   * - `false`: no header, raw children only
   * - `ReactNode`: custom header replacing the built-in one
   */
  header?: boolean | ReactNode;
};

/** @internal */
const DefaultHeader = ({ title, onClose }: { title: string; onClose: () => void }) => (
  <div className="openui-detailed-view-panel__header">
    <span className="openui-detailed-view-panel__title">{title}</span>
    <IconButton
      variant="tertiary"
      size="small"
      icon={<X size="1em" />}
      onClick={onClose}
      aria-label="Close detailed-view panel"
    />
  </div>
);

/**
 * Portals detailed-view content into the nearest {@link DetailedViewPortalTarget}.
 *
 * Renders nothing when the view is inactive or no portal target is mounted.
 * Wraps children in an error boundary and applies theme-scoped class names.
 *
 * Requires `<DetailedViewPortalTarget />` to be mounted in the layout.
 *
 * @category Components
 */
export const DetailedViewPanel = forwardRef<HTMLDivElement, DetailedViewPanelProps>(
  ({ viewId, children, title, className, errorFallback, header = true }, ref) => {
    const { isActive, close } = useDetailedView(viewId);
    const { node: panelNode } = useDetailedViewPortalTarget();
    const { portalThemeClassName } = useTheme();

    useEffect(() => {
      if (!isActive || panelNode) return;

      const timer = setTimeout(() => {
        console.warn(
          "[OpenUI] DetailedViewPanel: view is active but no render target is mounted. " +
            "Ensure <DetailedViewPortalTarget /> is rendered in your layout.",
        );
      }, 100);
      return () => clearTimeout(timer);
    }, [isActive, panelNode]);

    if (!isActive || !panelNode) return null;

    const handleClose = () => close();

    let headerContent: ReactNode = null;
    if (header === true) {
      headerContent = <DefaultHeader title={title ?? "Detailed view"} onClose={handleClose} />;
    } else if (header !== false) {
      headerContent = header;
    }

    return createPortal(
      <div
        ref={ref}
        id={`openui-detailed-view-panel-${viewId}`}
        className={clsx("openui-detailed-view-panel", portalThemeClassName, className)}
        role="region"
        aria-label={title ?? "Detailed view panel"}
      >
        {headerContent}
        <DetailedViewErrorBoundary fallback={errorFallback}>{children}</DetailedViewErrorBoundary>
      </div>,
      panelNode,
    );
  },
);

DetailedViewPanel.displayName = "DetailedViewPanel";
