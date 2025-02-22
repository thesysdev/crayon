import React, { useEffect, useState } from "react";
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
  urls: string[];
  columnCount?: number;
  gap?: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ urls, columnCount = 3, gap = 10 }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(true);
    const loadImages = async () => {
      try {
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
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [urls]);

  const getColumns = () => {
    if (isLoading || images.length === 0) {
      return [];
    }

    const columns: Image[][] = Array.from({ length: columnCount }, () => []);

    // Distribute images evenly across columns
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex]!.push(image);
    });

    // Calculate the ideal height for each column
    const avgColumnHeight = columns.reduce((maxHeight, column) => {
      const columnHeight = column.reduce((sum, img) => {
        return sum + (img.aspectRatio ? 1 / img.aspectRatio : 1);
      }, 0);
      return Math.max(maxHeight, columnHeight);
    }, 0);

    // Adjust image heights in each column
    columns.forEach((column) => {
      const totalRatio = column.reduce((sum, img) => {
        return sum + (img.aspectRatio ? 1 / img.aspectRatio : 1);
      }, 0);
      const scaleFactor = avgColumnHeight / totalRatio;

      column.forEach((image) => {
        image.adjustedHeight = image.aspectRatio ? (1 / image.aspectRatio) * scaleFactor : 1;
      });
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
