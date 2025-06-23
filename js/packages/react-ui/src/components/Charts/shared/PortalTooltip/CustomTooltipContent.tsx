import clsx from "clsx";
import { forwardRef, memo, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import { ChartStyle, getPayloadConfigFromPayload, useChart } from "../../../Charts/Charts";
import { FloatingUIPortal } from "./FloatingUIPortal";
import { tooltipNumberFormatter } from "./utils";

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

      // this is active when we pass a labelFormatter prop to the recharts tooltip
      // normally we would not need this, but it's useful for customizing the label
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

      if (payload.length <= 2) {
        return payload.map((item, index) => {
          const key = `${nameKey ?? item.name ?? item.dataKey ?? "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = (color ?? item.payload?.fill) || item.color;

          return (
            <div
              key={`${item.dataKey}-${index}`}
              className={clsx(
                "crayon-chart-tooltip-content-item",
                // indicator === DEFAULT_INDICATOR && "crayon-chart-tooltip-content-item--dot",
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    // this is the color indicator
                    !hideIndicator && (
                      <div
                        className={clsx(
                          "crayon-chart-tooltip-content-indicator",
                          `crayon-chart-tooltip-content-indicator--${indicator}`,
                          "crayon-chart-tooltip-content-indicator--two-items",
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
                      "crayon-chart-tooltip-content-value-wrapper--vertical",
                      nestLabel
                        ? "crayon-chart-tooltip-content-value-wrapper--nested"
                        : "crayon-chart-tooltip-content-value-wrapper--standard",
                    )}
                  >
                    <div className="crayon-chart-tooltip-content-label">
                      {nestLabel && tooltipLabel}
                      <span>{itemConfig?.label || item.name}</span>
                    </div>

                    {/* this is the value the number or the string */}
                    {item.value !== undefined && (
                      <span
                        className={clsx(
                          "crayon-chart-tooltip-content-value",
                          showPercentage && "percentage",
                        )}
                      >
                        {typeof item.value === "number"
                          ? tooltipNumberFormatter(item.value)
                          : item.value}
                        {showPercentage ? "%" : ""}
                      </span>
                    )}
                  </div>
                </>
              )}
              <div className="crayon-chart-tooltip-content-item-separator" />
            </div>
          );
        });
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
                      {typeof item.value === "number"
                        ? tooltipNumberFormatter(item.value)
                        : item.value}
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
        <div className="crayon-chart-tooltip-content-item-separator" />
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
