import React, { Children, isValidElement, useEffect, useState } from "react";
import { Image, ImageProps } from "../Image";
import "./ImageGallery.scss";

interface Image {
  id: string;
  url: string;
  width: number;
  height: number;
  aspectRatio?: number;
  adjustedHeight?: number;
  caption?: string;
}

interface ImageGalleryProps {
  children: React.ReactNode;
  columnCount?: number;
  gap?: number;
}

// Loads and returns dimensions of an image given its URL

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.src = url;
  });
};

// Extracts image URLs from child Image components

const extractImageUrls = (children: React.ReactNode): string[] => {
  const urls: string[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === Image) {
      const imageProps = child.props as ImageProps;
      if (imageProps.src) {
        urls.push(imageProps.src);
      }
    }
  });
  return urls;
};

// Calculates and adjusts column heights to ensure balanced layout

const calculateColumnHeights = (columns: Image[][]) => {
  const avgColumnHeight = columns.reduce((maxHeight, column) => {
    const columnHeight = column.reduce(
      (sum, img) => sum + (img.aspectRatio ? 1 / img.aspectRatio : 1),
      0,
    );
    return Math.max(maxHeight, columnHeight);
  }, 0);

  columns.forEach((column) => {
    const totalRatio = column.reduce(
      (sum, img) => sum + (img.aspectRatio ? 1 / img.aspectRatio : 1),
      0,
    );
    const scaleFactor = avgColumnHeight / totalRatio;

    column.forEach((image) => {
      image.adjustedHeight = image.aspectRatio ? (1 / image.aspectRatio) * scaleFactor : 1;
    });
  });

  return columns;
};

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  children,
  columnCount = 3,
  gap = 10,
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Loads images and their dimensions when children change

  useEffect(() => {
    let mounted = true;

    const loadImages = async () => {
      try {
        const urls = extractImageUrls(children);
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
        // Only update state if component is still mounted
        if (mounted) {
          setImages(imagesWithDimensions);
        }
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    setIsLoading(true);
    loadImages();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      mounted = false;
    };
  }, [children]);

  // Distributes images across columns and calculates their heights

  const getColumns = () => {
    if (isLoading || images.length === 0) return [];

    const columns: Image[][] = Array.from({ length: columnCount }, () => []);
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex]!.push(image);
    });

    return calculateColumnHeights(columns);
  };

  if (isLoading) {
    return <div className="crayon-gallery crayon-gallery--loading">Loading...</div>;
  }

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
            <div
              key={image.id}
              className="crayon-gallery__item"
              style={{
                flex: image.adjustedHeight,
              }}
            >
              <div className="crayon-gallery__image-container">
                <img src={image.url} alt="" loading="lazy" className="crayon-gallery__image" />
                {image.caption && <div className="crayon-gallery__caption">{image.caption}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
