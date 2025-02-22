// ImageGallery.tsx
import React, { useEffect, useState } from "react";
import "./ImageGallery.scss";

interface Image {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio?: number;
  caption?: string;
}

interface ImageGalleryProps {
  urls: string[];
  columnCount?: number;
  gap?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ urls, columnCount = 3, gap = 10 }) => {
  const [images, setImages] = useState<Image[]>([]);

  // Utility function to calculate image dimensions
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
        });
      };
      img.src = url;
    });
  };

  useEffect(() => {
    const loadImages = async () => {
      const imagesWithDimensions = await Promise.all(
        urls.map(async (url, index) => {
          const dimensions = await getImageDimensions(url);
          return {
            id: `image-${index}`,
            url,
            ...dimensions,
            aspectRatio: dimensions.width / dimensions.height,
          };
        }),
      );

      setImages(imagesWithDimensions);
    };

    loadImages();
  }, [urls]);

  // Divide images into columns using the masonry approach
  const getColumns = () => {
    const columns: Image[][] = Array.from({ length: columnCount }, () => []);

    images.forEach((image) => {
      // Find the column with the smallest height
      const columnHeights = columns.map((column) =>
        column.reduce((height, img) => height + img.height / img.width, 0),
      );
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[shortestColumnIndex]!.push(image);
    });

    return columns;
  };

  return (
    <div
      className="crayon-gallery"
      style={
        {
          "--column-count": columnCount,
          "--gap": `${gap}px`,
        } as React.CSSProperties
      }
    >
      {getColumns().map((column, columnIndex) => (
        <div key={`column-${columnIndex}`} className="crayon-gallery__column">
          {column.map((image) => (
            <div key={image.id} className="crayon-gallery__item">
              <div className="crayon-gallery__image-container">
                <img src={image.url} alt="" loading="lazy" className="crayon-gallery__image" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
