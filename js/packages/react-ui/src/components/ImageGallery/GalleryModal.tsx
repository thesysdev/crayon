import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

interface GalleryModalProps {
  images: string[];
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

  // Memoize scroll check function
  const checkScroll = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setScrollButtons({
        showLeft: scrollLeft > 0,
        showRight: scrollLeft < scrollWidth - clientWidth - 1,
      });
    }
  }, []);

  // Check if scrolling is needed
  useEffect(() => {
    // Initial check
    checkScroll();

    const currentRef = carouselRef.current;
    if (currentRef) {
      currentRef.addEventListener("scroll", checkScroll);

      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(currentRef);

      return () => {
        currentRef.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
    return;
  }, [checkScroll]);

  // Memoize scroll handlers
  const scrollLeft = useCallback(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -140, behavior: "smooth" });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 140, behavior: "smooth" });
    }
  }, []);

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
          <IconButton size="extra-small" variant="secondary" icon={<X />} onClick={onClose} />
        </div>
        <div className="crayon-gallery__modal-main">
          <img src={images[selectedImageIndex]} alt={`Gallery image ${selectedImageIndex + 1}`} />
        </div>
        <div className="crayon-gallery__modal-carousel-container">
          {scrollButtons.showLeft && (
            <IconButton
              className={clsx(
                "crayon-gallery__carousel-button",
                "crayon-gallery__carousel-button--left",
              )}
              onClick={scrollLeft}
              aria-label="Scroll images left"
              icon={<ChevronLeft />}
              variant="secondary"
              size="small"
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
                <img src={image} alt={`Gallery thumbnail ${index + 1}`} />
              </div>
            ))}
          </div>

          {scrollButtons.showRight && (
            <IconButton
              className={clsx(
                "crayon-gallery__carousel-button",
                "crayon-gallery__carousel-button--right",
              )}
              onClick={scrollRight}
              aria-label="Scroll images right"
              icon={<ChevronRight />}
              variant="secondary"
              size="small"
            />
          )}
        </div>
      </div>
    </div>
  );
};
