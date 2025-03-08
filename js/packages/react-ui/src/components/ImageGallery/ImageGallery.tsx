import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";

interface CrayonGalleryProps {
  images: string[];
}

const getLayoutClassName = (imageCount: number): string => {
  switch (imageCount) {
    case 1:
      return "crayon-gallery--single";
    case 2:
      return "crayon-gallery--double";
    case 3:
      return "crayon-gallery--triple";
    case 4:
      return "crayon-gallery--quad";
    default:
      return "crayon-gallery--default";
  }
};

export const ImageGallery: React.FC<CrayonGalleryProps> = ({ images }) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const layoutClass = getLayoutClassName(images.length);

  // Check if scrolling is needed
  useEffect(() => {
    const checkScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        setShowLeftButton(scrollLeft > 0);
        setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
      }
    };

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
    return () => {};
  }, [showAll]);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -140, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 140, behavior: "smooth" });
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowAll(true);
  };

  const shouldShowButton = images.length > 5;

  return (
    <div className={clsx("crayon-gallery", layoutClass)}>
      <div className="crayon-gallery__grid">
        {images.slice(0, 5).map((image, index) => (
          <div
            key={index}
            className={clsx("crayon-gallery__image", index === 0 && "crayon-gallery__image--main")}
            onClick={() => handleImageClick(index)}
          >
            <img src={image} alt={`Gallery image ${index + 1}`} />
          </div>
        ))}
        {shouldShowButton && (
          <div className="crayon-gallery__show-all-button">
            <Button variant="primary" size="small" onClick={toggleShowAll}>
              Show All
            </Button>
          </div>
        )}
      </div>

      {showAll && (
        <div className="crayon-gallery__modal">
          <div className="crayon-gallery__modal-content">
            <IconButton
              className="crayon-gallery__close-button"
              icon={<X />}
              onClick={toggleShowAll}
              aria-label="Close gallery"
            />
            <div className="crayon-gallery__modal-main">
              <img
                src={images[selectedImageIndex]}
                alt={`Gallery image ${selectedImageIndex + 1}`}
              />
            </div>
            <div className="crayon-gallery__modal-carousel-container">
              {showLeftButton && (
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
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={image} alt={`Gallery thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>

              {showRightButton && (
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
      )}
    </div>
  );
};
