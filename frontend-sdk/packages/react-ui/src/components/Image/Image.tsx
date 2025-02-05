import * as AspectRatio from "@radix-ui/react-aspect-ratio";
import clsx from "clsx";
import React, { forwardRef } from "react";

type AspectRatioType = "1:1" | "3:2" | "3:4" | "4:3" | "16:9";
type ScaleType = "fit" | "fill";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  styles?: React.CSSProperties;
  className?: string;
  aspectRatio?: AspectRatioType;
  scale?: ScaleType;
}

const aspectRatioMap: Record<AspectRatioType, number> = {
  "1:1": 1,
  "3:2": 3 / 2,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "16:9": 16 / 9,
};

const scaleMap: Record<ScaleType, string> = {
  fit: "crayon-image-fit",
  fill: "crayon-image-fill",
};

export const Image = forwardRef<HTMLImageElement, ImageProps>((props, ref) => {
  const { src, alt, styles, className, aspectRatio = "3:2", scale = "fit", ...rest } = props;

  const imageClasses = clsx(
    "crayon-image",
    {
      [`${scaleMap[scale]}`]: scale,
    },
    className,
  );

  const image = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={imageClasses}
      style={styles}
      onError={(e) => {
        e.currentTarget.style.display = "none";
        console.error(`Failed to load image: ${src}`);
      }}
      {...rest}
    />
  );

  return <AspectRatio.Root ratio={aspectRatioMap[aspectRatio]}>{image}</AspectRatio.Root>;
});

Image.displayName = "Image";
