import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";
import { forwardRef, useEffect, useMemo, useState } from "react";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant: "continuous" | "discrete" | "range";
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  onValueChange: (value: number | number[]) => void;
  value: number[];
  className?: string;
  style?: React.CSSProperties;
}

export const Slider = forwardRef<React.ComponentRef<typeof SliderPrimitive.Root>, SliderProps>(
  (
    { variant, min, max, step, disabled, onValueChange, value, className, style, ...props },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(variant === "range" ? [min, max] : value);

    useEffect(() => {
      setInternalValue(variant === "range" ? [min, max] : (value ?? min));
    }, [variant, min, max, value]);

    const handleValueChange = (newValue: number[]) => {
      const value = variant === "range" ? newValue : newValue[0];
      if (value === undefined) return;
      setInternalValue(Array.isArray(value) ? value : [value]);
      if (onValueChange) onValueChange(value);
    };

    const sliderProps = useMemo(() => {
      const baseProps = { min, max, ...props };
      switch (variant) {
        case "continuous":
          return { ...baseProps, value: [internalValue] };
        case "discrete":
          if (step === undefined) {
            throw new Error("Step is required for discrete slider");
          }
          return { ...baseProps, step, value: [internalValue] };
        case "range":
          return { ...baseProps, value: internalValue };
      }
    }, [variant, min, max, step, internalValue]);

    const thumbs = useMemo(() => {
      const thumbClass = "slider-thumb-handle";
      const valueIndicatorClass = "slider-thumb-value";

      return variant === "range" ? (
        <>
          <SliderPrimitive.Thumb className="slider-thumb">
            <div className={thumbClass}>
              <div className="slider-thumb-handle-inner">
                <div className="slider-thumb-handle-inner-dot" />
              </div>
              {!disabled && (
                <div className={valueIndicatorClass}>
                  {Array.isArray(internalValue) ? internalValue[0] : internalValue}
                </div>
              )}
            </div>
          </SliderPrimitive.Thumb>
          <SliderPrimitive.Thumb className="slider-thumb">
            <div className={thumbClass}>
              <div className="slider-thumb-handle-inner">
                <div className="slider-thumb-handle-inner-dot" />
              </div>
              {!disabled && (
                <div className={valueIndicatorClass}>
                  {Array.isArray(internalValue) ? internalValue[1] : internalValue}
                </div>
              )}
            </div>
          </SliderPrimitive.Thumb>
        </>
      ) : (
        <SliderPrimitive.Thumb className="slider-thumb">
          <div className={thumbClass}>
            <div className="slider-thumb-handle-inner">
              <div className="slider-thumb-handle-inner-dot" />
            </div>
            {!disabled && <div className={valueIndicatorClass}>{internalValue}</div>}
          </div>
        </SliderPrimitive.Thumb>
      );
    }, [variant, internalValue, disabled]);

    const renderDots = () => {
      if (variant === "discrete" && step) {
        const numSteps = Math.floor((max - min) / step) - 1;
        return Array.from({ length: numSteps }, (_, index) => {
          const value = min + step * (index + 1);
          const position = ((value - min) / (max - min)) * 100;
          return <div key={value} className="slider-dots-dot" style={{ left: `${position}%` }} />;
        });
      }
      return null;
    };

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={clsx("slider-root", { "slider--disabled": disabled }, className)}
        {...sliderProps}
        onValueChange={handleValueChange}
        minStepsBetweenThumbs={1}
        disabled={disabled}
        key={variant}
        value={Array.isArray(internalValue) ? internalValue : [internalValue]}
        style={style}
      >
        <SliderPrimitive.Track className="slider-track">
          <SliderPrimitive.Range className="slider-range" />
          {variant === "discrete" && renderDots()}
        </SliderPrimitive.Track>
        {thumbs}
      </SliderPrimitive.Root>
    );
  },
);

export default Slider;
