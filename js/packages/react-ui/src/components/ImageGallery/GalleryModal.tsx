import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider";
import { ImageItem } from "./ImageGallery";

export interface GalleryModalProps {
  images: ImageItem[];
  selectedImageIndex: number;
  setSelectedImageIndex: (index: number) => void;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  images,
  selectedImageIndex,
  setSelectedImageIndex,
  onClose,
}) => {
  const [scrollButtons, setScrollButtons] = useState({ showLeft: false, showRight: false });
  const carouselRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const { portalThemeClassName } = useTheme();

  // Check if scrolling is needed
  const checkScroll = useCallback(() => {
    if (!carouselRef.current) return;

    const container = carouselRef.current;
    setScrollButtons({
      showLeft: container.scrollLeft > 0,
      showRight: container.scrollLeft + container.offsetWidth < container.scrollWidth,
    });
  }, []);

  useEffect(() => {
    if (!carouselRef.current) {
      return;
    }

    const container = carouselRef.current;
    // Initial check
    checkScroll();

    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(container);

    container.addEventListener("scroll", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  // Handle modal lifecycle events (scroll lock, close on escape, close on outside click)
  useEffect(() => {
    // Disable body scroll
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);

    // Cleanup
    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const container = carouselRef.current;
      const containerRect = container.getBoundingClientRect();
      const scrollAmount = containerRect.width * 0.28;

      if (direction === "left") {
        container.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        container.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  // Memoize thumbnail click handler
  const handleThumbnailClick = useCallback(
    (index: number) => () => setSelectedImageIndex(index),
    [setSelectedImageIndex],
  );

  return createPortal(
    <div className={clsx("crayon-gallery__modal", portalThemeClassName)}>
      <div className="crayon-gallery__modal-content" ref={modalContentRef}>
        <div className="crayon-gallery__modal-header">
          <span className="crayon-gallery__modal-heading">All Photos</span>
          <IconButton size="small" variant="secondary" icon={<X />} onClick={onClose} />
        </div>
        <div className="crayon-gallery__modal-main">
          <img
            src={images[selectedImageIndex]?.src}
            alt={images[selectedImageIndex]?.alt || `Gallery image ${selectedImageIndex + 1}`}
          />
        </div>
        <div className="crayon-gallery__modal-carousel-container">
          {scrollButtons.showLeft && (
            <div
              className={clsx(
                "crayon-gallery__modal-carousel-button-container",
                "crayon-gallery__modal-carousel-button-container-left",
              )}
            >
              <IconButton
                className={clsx(
                  "crayon-gallery__carousel-button",
                  "crayon-gallery__carousel-button--left",
                )}
                onClick={() => scroll("left")}
                aria-label="Scroll images left"
                icon={<ChevronLeft />}
                variant="secondary"
                size="extra-small"
              />
            </div>
          )}

          <div className="crayon-gallery__modal-carousel" ref={carouselRef}>
            {images.map((image, index) => (
              <div
                key={index}
                className={clsx(
                  "crayon-gallery__modal-thumbnail",
                  index === selectedImageIndex && "crayon-gallery__modal-thumbnail--active",
                )}
                onClick={handleThumbnailClick(index)}
              >
                <img src={image.src} alt={image.alt || `Gallery thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>

          {scrollButtons.showRight && (
            <div
              className={clsx(
                "crayon-gallery__modal-carousel-button-container",
                "crayon-gallery__modal-carousel-button-container-right",
              )}
            >
              <IconButton
                className={clsx(
                  "crayon-gallery__carousel-button",
                  "crayon-gallery__carousel-button--right",
                )}
                onClick={() => scroll("right")}
                aria-label="Scroll images right"
                icon={<ChevronRight />}
                variant="secondary"
                size="extra-small"
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
