import clsx from "clsx";
import { forwardRef, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartConfig, useChart } from "../../../Charts/Charts";
import { FloatingUIPortal } from "./FloatingUIPortal";

/**
 * Helper function to extract configuration for a chart element from a payload
 * (Local copy since getPayloadConfigFromPayload is not exported from Charts)
 */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

/**
 * Custom tooltip content component for floating tooltips
 * Mirrors the functionality of ChartTooltipContent but works with FloatingUIPortal
 */
export const CustomTooltipContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
      showPercentage?: boolean;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
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
      coordinate,
    },
    ref,
  ) => {
    const { config } = useChart();

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

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    const tooltipContent = (
      <div ref={ref} className={clsx("crayon-chart-tooltip", className)}>
        {!nestLabel && tooltipLabel}
        <div className="crayon-chart-tooltip-content">
          {payload.map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = (color ?? item.payload.fill) || item.color;

            return (
              <div
                key={item.dataKey}
                className={clsx(
                  "crayon-chart-tooltip-content-item",
                  indicator === "dot" && "crayon-chart-tooltip-content-item--dot",
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
                          {item.value.toLocaleString()}
                          {showPercentage ? "%" : ""}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );

    return <FloatingUIPortal active={active || false}>{tooltipContent}</FloatingUIPortal>;
  },
);

CustomTooltipContent.displayName = "CustomTooltipContent";
