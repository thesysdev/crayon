import { useCallback, useEffect, useRef, useState } from "react";

interface UseDetailedViewResizeProps {
  isDetailedViewActive: boolean;
  isMobile: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface UseDetailedViewResizeReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  chatPanelRef: React.RefObject<HTMLDivElement | null>;
  detailedViewPanelRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  handleResize: (clientX: number) => void;
  handleDragStart: () => void;
  handleDragEnd: () => void;
}

const INITIAL_CHAT_WIDTH = 420;
const MIN_CHAT_WIDTH = 420;
const MAX_CHAT_WIDTH_RATIO = 0.8;

/**
 * Custom hook to manage detailed-view panel resizing logic (desktop only).
 * Handles:
 * - Chat panel width constraints
 * - Resize drag events
 * - Sidebar state when detailed view is active/inactive
 */
export const useDetailedViewResize = ({
  isDetailedViewActive,
  isMobile,
  setIsSidebarOpen,
}: UseDetailedViewResizeProps): UseDetailedViewResizeReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const detailedViewPanelRef = useRef<HTMLDivElement>(null);

  // Handle sidebar visibility and panel widths when detailed-view state changes
  useEffect(() => {
    if (isMobile) return;

    if (isDetailedViewActive) {
      // Desktop view active: close sidebar and set chat width to 420px
      setIsSidebarOpen(false);
      if (chatPanelRef.current) {
        chatPanelRef.current.style.width = `${INITIAL_CHAT_WIDTH}px`;
      }
    } else {
      // Desktop view inactive: open sidebar and reset chat width
      setIsSidebarOpen(true);
      if (chatPanelRef.current) {
        chatPanelRef.current.style.width = "100%";
      }
    }
  }, [isDetailedViewActive, isMobile, setIsSidebarOpen]);

  const handleResize = useCallback((clientX: number) => {
    if (!containerRef.current || !chatPanelRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidthPx = clientX - containerRect.left;

    // Constrain width between min and max
    const maxWidthPx = containerRect.width * MAX_CHAT_WIDTH_RATIO;
    const constrainedWidth = Math.min(Math.max(newWidthPx, MIN_CHAT_WIDTH), maxWidthPx);

    chatPanelRef.current.style.width = `${constrainedWidth}px`;
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    containerRef,
    chatPanelRef,
    detailedViewPanelRef,
    isDragging,
    handleResize,
    handleDragStart,
    handleDragEnd,
  };
};
