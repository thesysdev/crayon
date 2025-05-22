import clsx from "clsx";
import { forwardRef, useCallback, useMemo, useState } from "react";
import { Button } from "../Button";
import { GalleryModal } from "./GalleryModal";

export interface ImageItem {
  src: string;
  alt?: string;
  details?: string;
}

export interface CrayonGalleryProps {
  images: ImageItem[];
}

const MAX_GRID_IMAGES = 5;
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

export const ImageGallery = forwardRef<HTMLDivElement, CrayonGalleryProps>(({ images }, ref) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Memoize layout class to prevent recalculation
  const layoutClass = useMemo(() => getLayoutClassName(images.length), [images.length]);

  // Memoize whether to show button
  const shouldShowButton = useMemo(() => images.length > MAX_GRID_IMAGES, [images.length]);

  // Memoize visible images
  const visibleImages = useMemo(() => images.slice(0, MAX_GRID_IMAGES), [images]);

  // Memoize callbacks
  const toggleShowAll = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setShowAll(true);
  }, []);

  const setSelectedImageIndexMemoized = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  return (
    <div className={clsx("crayon-gallery", layoutClass)} ref={ref}>
      <div className="crayon-gallery__grid">
        {visibleImages.map((image, index) => (
          <div
            key={index}
            className={clsx("crayon-gallery__image", index === 0 && "crayon-gallery__image--main")}
            onClick={() => handleImageClick(index)}
          >
            <img src={image.src} alt={image.alt || `Gallery image ${index + 1}`} />
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
        <GalleryModal
          images={images}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndexMemoized}
          onClose={toggleShowAll}
        />
      )}
    </div>
  );
});
