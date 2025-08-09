import { useEffect, useState } from "react";

/**
 * Custom hook to manage tooltip disable state based on touch/scroll interactions
 * outside the scroll area. This prevents tooltips from reappearing when users
 * touch back inside the scroll area after touching outside it.
 *
 * @returns {object} Object containing isTooltipDisabled state and setter
 */
export const useTooltipDisable = () => {
  const [isTooltipDisabled, setIsTooltipDisabled] = useState(false);

  useEffect(() => {
    const checkIfOutsideScrollArea = (target: EventTarget | null) => {
      const scrollArea = document.querySelector(".crayon-shell-thread-scroll-area");
      // Always use document.body as the container reference
      if (document.body && target && !scrollArea?.contains(target as Node)) {
        setIsTooltipDisabled(true);
        return true;
      } else if (document.body && target && scrollArea?.contains(target as Node)) {
        setIsTooltipDisabled(false);
        return false;
      }
      return false;
    };

    const handleTouch = (e: TouchEvent) => {
      checkIfOutsideScrollArea(e.target);
    };

    const handleScroll = () => {
      // During scroll, check if any active tooltips are still within scroll area
      const scrollArea = document.querySelector(".crayon-shell-thread-scroll-area");
      const activeTooltips = document.querySelectorAll(".crayon-chart-tooltip");

      if (scrollArea && activeTooltips.length > 0) {
        // Check if tooltips are still within the scroll area bounds
        const scrollRect = scrollArea.getBoundingClientRect();
        let shouldDisable = false;

        activeTooltips.forEach((tooltip) => {
          const tooltipRect = tooltip.getBoundingClientRect();
          // Check if tooltip is outside scroll area boundaries
          if (
            tooltipRect.top < scrollRect.top ||
            tooltipRect.bottom > scrollRect.bottom ||
            tooltipRect.left < scrollRect.left ||
            tooltipRect.right > scrollRect.right
          ) {
            shouldDisable = true;
          }
        });

        if (shouldDisable) {
          setIsTooltipDisabled(true);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Check if touch move is outside scroll area during scrolling
      checkIfOutsideScrollArea(e.target);
    };

    // Use capture phase to ensure we catch events before they bubble
    const options = { capture: true, passive: true };

    document.body.addEventListener("touchstart", handleTouch, options);
    document.body.addEventListener("touchend", handleTouch, options);
    document.body.addEventListener("touchmove", handleTouchMove, options);
    document.body.addEventListener("scroll", handleScroll, options);

    return () => {
      document.body.removeEventListener("touchstart", handleTouch, options);
      document.body.removeEventListener("touchend", handleTouch, options);
      document.body.removeEventListener("touchmove", handleTouchMove, options);
      document.body.removeEventListener("scroll", handleScroll, options);
    };
  }, []);

  return {
    isTooltipDisabled,
    setIsTooltipDisabled,
  };
};
