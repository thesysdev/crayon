import { useActiveDetailedView } from "@openuidev/react-headless";
import clsx from "clsx";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useMultipleRefs } from "../../../../hooks/useMultipleRefs";
import { DetailedViewPortalTarget } from "./DetailedViewPortalTarget";

/**
 * Props for {@link DetailedViewOverlay}.
 *
 * @category Components
 */
export type DetailedViewOverlayProps = {
  /** Additional CSS class name(s) applied to the overlay container. */
  className?: string;
};

/**
 * Shared overlay wrapper for the detailed-view portal target.
 * Used by the AgentInterface chat surface.
 * Renders an absolute-positioned overlay with slide-in/slide-out animations.
 *
 * @category Components
 */
export const DetailedViewOverlay = forwardRef<HTMLDivElement, DetailedViewOverlayProps>(
  ({ className }, ref) => {
    const { isDetailedViewActive } = useActiveDetailedView();
    const [shouldRender, setShouldRender] = useState(isDetailedViewActive);
    const [isExiting, setIsExiting] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMultipleRefs<HTMLDivElement>(ref, internalRef);

    useEffect(() => {
      if (isDetailedViewActive) {
        // Opening: mount immediately, cancel any in-progress exit
        setShouldRender(true);
        setIsExiting(false);
      } else if (shouldRender) {
        // Closing: start exit animation, defer unmount
        setIsExiting(true);
      }
    }, [isDetailedViewActive]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAnimationEnd = useCallback(
      (e: React.AnimationEvent<HTMLDivElement>) => {
        // Only react to our own animation, not children's animations bubbling up
        if (e.target !== internalRef.current) return;
        if (isExiting) {
          setShouldRender(false);
          setIsExiting(false);
        }
      },
      [isExiting],
    );

    if (!shouldRender) return null;

    return (
      <div
        ref={mergedRef}
        className={clsx(
          "openui-detailed-view-overlay",
          { "openui-detailed-view-overlay--exiting": isExiting },
          className,
        )}
        onAnimationEnd={handleAnimationEnd}
      >
        <DetailedViewPortalTarget />
      </div>
    );
  },
);

DetailedViewOverlay.displayName = "DetailedViewOverlay";
