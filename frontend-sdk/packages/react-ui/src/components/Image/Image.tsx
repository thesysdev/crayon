import React from 'react';
import clsx from 'clsx';
import * as AspectRatio from '@radix-ui/react-aspect-ratio';

export interface ImageProps {
  src: string;
  alt: string;
  styles?: React.CSSProperties;
  className?: string;
  aspectRatio?: "1:1" | "3:2" | "3:4" | "4:3" | "16:9";
  scale?: "fit" | "fill";
}

const aspectRatioMap = {
  "1:1": 1,
  "3:2": 3/2,
  "3:4": 3/4,
  "4:3": 4/3,
  "16:9": 16/9,
};

export const Image = (props: ImageProps) => {
  const { src, alt, styles, className, aspectRatio = "1:1", scale = "fit" } = props;

  const imageClasses = clsx(
    'image',
    {
      [`image-${scale}`]: scale,
    },
    className
  );

  const image = (
    <img 
      src={src} 
      alt={alt} 
      className={imageClasses} 
      style={styles}
    />
  );

  if (aspectRatio) {
    return (
      <AspectRatio.Root ratio={aspectRatioMap[aspectRatio]}>
        {image}
      </AspectRatio.Root>
    );
  }

  return image;
};
