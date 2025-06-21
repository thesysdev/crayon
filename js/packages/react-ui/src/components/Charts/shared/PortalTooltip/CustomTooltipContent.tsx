import clsx from "clsx";
import { forwardRef, memo, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartStyle, getPayloadConfigFromPayload, useChart } from "../../../Charts/Charts";
import { FloatingUIPortal } from "./FloatingUIPortal";

const DEFAULT_INDICATOR = "dot" as const;

/**
 * Custom tooltip content component for floating tooltips
 * Mirrors the functionality of ChartTooltipContent but works with FloatingUIPortal
 */
export const CustomTooltipContent = memo(
  forwardRef<
    HTMLDivElement,
    React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
      React.ComponentProps<"div"> & {
        hideLabel?: boolean;
        hideIndicator?: boolean;
        indicator?: "line" | "dot" | "dashed";
        nameKey?: string;
        labelKey?: string;
        showPercentage?: boolean;
        portalContainer?: React.RefObject<HTMLElement | null>;
      }
  >((props, ref) => {
    const {
      active,
      payload,
      className,
      indicator = DEFAULT_INDICATOR,
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      showPercentage = false,
      portalContainer,
      offset,
    } = props;

    const { config, id } = useChart();

    const tooltipLabel = useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey ?? item?.dataKey ?? item?.name ?? "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={clsx("crayon-chart-tooltip-label-heavy", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={clsx("crayon-chart-tooltip-label", labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    const nestLabel = useMemo(
      () => payload?.length === 1 && indicator !== DEFAULT_INDICATOR,
      [payload?.length, indicator],
    );

    const payloadItems = useMemo(() => {
      if (!payload?.length) {
        return [];
      }

      return payload.map((item, index) => {
        const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        const indicatorColor = (color ?? item.payload?.fill) || item.color;

        return (
          <div
            key={`${item.dataKey}-${index}`}
            className={clsx(
              "crayon-chart-tooltip-content-item",
              indicator === DEFAULT_INDICATOR && "crayon-chart-tooltip-content-item--dot",
            )}
          >
            {formatter && item?.value !== undefined && item.name ? (
              formatter(item.value, item.name, item, index, item.payload)
            ) : (
              <>
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : (
                  !hideIndicator && (
                    <div
                      className={clsx(
                        "crayon-chart-tooltip-content-indicator",
                        `crayon-chart-tooltip-content-indicator--${indicator}`,
                      )}
                      style={
                        {
                          "--color-bg": indicatorColor,
                          "--color-border": indicatorColor,
                        } as React.CSSProperties
                      }
                    />
                  )
                )}
                <div
                  className={clsx(
                    "crayon-chart-tooltip-content-value-wrapper",
                    nestLabel
                      ? "crayon-chart-tooltip-content-value-wrapper--nested"
                      : "crayon-chart-tooltip-content-value-wrapper--standard",
                  )}
                >
                  <div className="crayon-chart-tooltip-content-label">
                    {nestLabel && tooltipLabel}
                    <span>{itemConfig?.label || item.name}</span>
                  </div>
                  {item.value !== undefined && (
                    <span
                      className={clsx(
                        "crayon-chart-tooltip-content-value",
                        showPercentage && "percentage",
                      )}
                    >
                      {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
                      {showPercentage ? "%" : ""}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        );
      });
    }, [
      payload,
      nameKey,
      config,
      color,
      indicator,
      formatter,
      hideIndicator,
      nestLabel,
      tooltipLabel,
      showPercentage,
    ]);

    // Early return for inactive or empty payload - moved after all hooks
    if (!active || !payload?.length) {
      return null;
    }

    const tooltipContent = (
      <div ref={ref} className={clsx("crayon-chart-tooltip", className)}>
        {!nestLabel && tooltipLabel}
        <div className="crayon-chart-tooltip-content">{payloadItems}</div>
      </div>
    );

    return (
      <FloatingUIPortal
        active={active}
        chartId={id}
        portalContainer={portalContainer}
        offsetDistance={offset}
      >
        <ChartStyle id={id} config={config} />
        {tooltipContent}
      </FloatingUIPortal>
    );
  }),
);

CustomTooltipContent.displayName = "CustomTooltipContent";
