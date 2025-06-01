import * as SliderPrimitive from "@radix-ui/react-slider";
import clsx from "clsx";
import { forwardRef, useMemo, useState } from "react";

export interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  variant: "continuous" | "discrete" | "range";
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  defaultValue?: number[];
  className?: string;
  style?: React.CSSProperties;
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
      onValueChange,
      defaultValue,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    // used to show the correct value on thumb
    const [internalValue, setInternalValue] = useState(value || defaultValue);
    const valueToShow = value || internalValue;

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
                <div className={valueIndicatorClass}>{valueToShow && valueToShow[0]}</div>
              )}
            </div>
          </SliderPrimitive.Thumb>
          <SliderPrimitive.Thumb className="slider-thumb">
            <div className={thumbClass}>
              <div className="slider-thumb-handle-inner">
                <div className="slider-thumb-handle-inner-dot" />
              </div>
              {!disabled && (
                <div className={valueIndicatorClass}>{valueToShow && valueToShow[1]}</div>
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
            {!disabled && (
              <div className={valueIndicatorClass}>{valueToShow && valueToShow[0]}</div>
            )}
          </div>
        </SliderPrimitive.Thumb>
      );
    }, [variant, defaultValue, disabled, valueToShow]);

    const renderDots = () => {
      if (variant === "discrete" && step) {
        const numSteps = Math.floor((max - min) / step);
        return Array.from({ length: numSteps + 1 }, (_, index) => {
          const value = min + step * index;
          const position = ((value - min) / (max - min)) * 100;
          return <div key={value} className="slider-dots-dot" style={{ left: `${position}%` }} />;
        });
      }
      return null;
    };

    return (
      <div className="slider-container">
        <SliderPrimitive.Root
          ref={ref}
          className={clsx("slider-root", { "slider--disabled": disabled }, className)}
          {...props}
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={(value) => {
            setInternalValue(value);
            onValueChange?.(value);
          }}
          minStepsBetweenThumbs={1}
          disabled={disabled}
          key={variant}
          defaultValue={defaultValue}
          style={style}
        >
          <SliderPrimitive.Track className="slider-track">
            <SliderPrimitive.Range className="slider-range" />
            {variant === "discrete" && renderDots()}
          </SliderPrimitive.Track>
          {thumbs}
        </SliderPrimitive.Root>
      </div>
    );
  },
);

export default Slider;
