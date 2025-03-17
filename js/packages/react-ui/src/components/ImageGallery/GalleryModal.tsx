import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";
import { ImageItem } from "./ImageGallery";

interface GalleryModalProps {
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

  return (
    <div className="crayon-gallery__modal">
      <div className="crayon-gallery__modal-content">
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
          )}
        </div>
      </div>
    </div>
  );
};
