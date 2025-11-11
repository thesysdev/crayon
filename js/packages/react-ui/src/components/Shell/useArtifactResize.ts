import { useCallback, useEffect, useRef, useState } from "react";

interface UseArtifactResizeProps {
  isArtifactActive: boolean;
  isMobile: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

interface UseArtifactResizeReturn {
  containerRef: React.RefObject<HTMLDivElement | null>;
  chatPanelRef: React.RefObject<HTMLDivElement | null>;
  artifactPanelRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
  handleResize: (clientX: number) => void;
  handleDragStart: () => void;
  handleDragEnd: () => void;
}

const INITIAL_CHAT_WIDTH = 420;
const MIN_CHAT_WIDTH = 420;
const MAX_CHAT_WIDTH_RATIO = 0.8;

/**
 * Custom hook to manage artifact panel resizing logic (desktop only).
 * Handles:
 * - Chat panel width constraints
 * - Resize drag events
 * - Sidebar state when artifact is active/inactive
 */
export const useArtifactResize = ({
  isArtifactActive,
  isMobile,
  setIsSidebarOpen,
}: UseArtifactResizeProps): UseArtifactResizeReturn => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const artifactPanelRef = useRef<HTMLDivElement>(null);

  // Handle sidebar visibility and panel widths when artifact state changes
  useEffect(() => {
    if (isMobile) return;

    if (isArtifactActive) {
      // Desktop artifact active: close sidebar and set chat width to 420px
      setIsSidebarOpen(false);
      if (chatPanelRef.current) {
        chatPanelRef.current.style.width = `${INITIAL_CHAT_WIDTH}px`;
      }
    } else {
      // Desktop artifact inactive: open sidebar and reset chat width
      setIsSidebarOpen(true);
      if (chatPanelRef.current) {
        chatPanelRef.current.style.width = "100%";
      }
    }
  }, [isArtifactActive, isMobile, setIsSidebarOpen]);

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
    artifactPanelRef,
    isDragging,
    handleResize,
    handleDragStart,
    handleDragEnd,
  };
};

