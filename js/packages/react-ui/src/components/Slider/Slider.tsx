import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";
import { forwardRef, ReactNode, useMemo, useState } from "react";

const formatNumber = (num: number | undefined): string => {
  if (num === undefined) {
    return "";
  }
  // format number to k, m, b
  if (num >= 1000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    })
      .format(num)
      .toLowerCase();
  }
  return String(num);
};

export interface SliderProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    "value" | "defaultValue"
  > {
  variant: "continuous" | "discrete";
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  value?: number[];
  defaultValue?: number[];
  className?: string;
  style?: React.CSSProperties;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

export const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    {
      variant,
      min,
      max,
      step,
      disabled,
      value,
      defaultValue,
      onValueChange,
      className,
      style,
      leftContent,
      rightContent,
      ...props
    },
    ref,
  ) => {
    // used to show the correct value on thumb
    const [internalValue, setInternalValue] = useState(
      defaultValue && defaultValue.length > 0 ? defaultValue : [min],
    );

    const isControlled = value !== undefined;
    const valueToShow = isControlled ? value : internalValue;

    const isRange = valueToShow && valueToShow.length > 1;

    const thumbs = useMemo(() => {
      const thumbClass = "crayon-slider-thumb-handle";
      const valueIndicatorClass = "crayon-slider-thumb-value";

      if (isRange) {
        return (
          <>
            {valueToShow?.map((v, i) => (
              <SliderPrimitive.Thumb key={i} className="crayon-slider-thumb">
                <div className={thumbClass}>
                  <div className="crayon-slider-thumb-handle-inner">
                    <div className="crayon-slider-thumb-handle-inner-dot" />
                  </div>
                  {!disabled && <div className={valueIndicatorClass}>{formatNumber(v)}</div>}
                </div>
              </SliderPrimitive.Thumb>
            ))}
          </>
        );
      }

      return (
        <SliderPrimitive.Thumb className="crayon-slider-thumb">
          <div className={thumbClass}>
            <div className="crayon-slider-thumb-handle-inner">
              <div className="crayon-slider-thumb-handle-inner-dot" />
            </div>
            {!disabled && (
              <div className={valueIndicatorClass}>{formatNumber(valueToShow?.[0])}</div>
            )}
          </div>
        </SliderPrimitive.Thumb>
      );
    }, [disabled, valueToShow, isRange]);

    const renderDots = () => {
      if (variant === "discrete" && step) {
        const numSteps = Math.floor((max - min) / step);
        return Array.from({ length: numSteps + 1 }, (_, index) => {
          const value = min + step * index;
          const position = ((value - min) / (max - min)) * 100;
          return (
            <div key={value} className="crayon-slider-dots-dot" style={{ left: `${position}%` }} />
          );
        });
      }
      return null;
    };

    return (
      <div className="crayon-slider-wrapper">
        {leftContent && <div className="crayon-slider-left-content">{leftContent}</div>}
        <div className="crayon-slider-container-wrapper">
          <div className="crayon-slider-container">
            <SliderPrimitive.Root
              ref={ref}
              className={clsx(
                "crayon-slider-root",
                { "crayon-slider--disabled": disabled },
                className,
              )}
              {...props}
              min={min}
              max={max}
              step={step}
              value={valueToShow}
              onValueChange={(val) => {
                if (!isControlled) {
                  setInternalValue(val);
                }
                onValueChange?.(val);
              }}
              minStepsBetweenThumbs={1}
              disabled={disabled}
              key={variant}
              style={style}
            >
              <SliderPrimitive.Track className="crayon-slider-track">
                <SliderPrimitive.Range
                  className={clsx("crayon-slider-range", {
                    "crayon-slider-range--at-min": !isRange && valueToShow?.[0] === min,
                  })}
                />
                {variant === "discrete" && renderDots()}
              </SliderPrimitive.Track>
              {thumbs}
            </SliderPrimitive.Root>
          </div>
          <div className="crayon-slider-labels">
            <span>{formatNumber(min)}</span>
            <span>{formatNumber(max)}</span>
          </div>
        </div>
        {rightContent && <div className="crayon-slider-right-content">{rightContent}</div>}
      </div>
    );
  },
);
