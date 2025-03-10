import clsx from "clsx";
import React, { useState } from "react";
import { Button } from "../Button";
import { GalleryModal } from "./GalleryModal";

interface CrayonGalleryProps {
  images: string[];
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

export const ImageGallery: React.FC<CrayonGalleryProps> = ({ images }) => {
  const [showAll, setShowAll] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const layoutClass = getLayoutClassName(images.length);

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowAll(true);
  };

  const shouldShowButton = images.length > MAX_GRID_IMAGES;

  return (
    <div className={clsx("crayon-gallery", layoutClass)}>
      <div className="crayon-gallery__grid">
        {images.slice(0, MAX_GRID_IMAGES).map((image, index) => (
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
        <GalleryModal
          images={images}
          selectedImageIndex={selectedImageIndex}
          setSelectedImageIndex={setSelectedImageIndex}
          onClose={toggleShowAll}
        />
      )}
    </div>
  );
};
