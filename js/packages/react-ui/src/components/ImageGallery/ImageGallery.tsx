import React, { Children, isValidElement, useEffect, useState } from "react";
import { Image, ImageProps } from "../Image";

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

    // Initialize columns
    const columns: Image[][] = Array.from({ length: columnCount }, () => []);

    // First, distribute images to shortest column
    images.forEach((image) => {
      // Calculate current height of each column
      const columnHeights = columns.map((column) =>
        column.reduce((sum, img) => sum + img.height / img.width, 0),
      );

      // Find the column with minimum height
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

      // Add image to shortest column
      columns[shortestColumnIndex]!.push(image);
    });

    return columns;
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
            <div key={image.id} className="crayon-gallery__item">
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
