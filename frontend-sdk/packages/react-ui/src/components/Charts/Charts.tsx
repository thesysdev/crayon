import clsx from "clsx";
import { uniqueId } from "lodash-es";
import { ComponentProps, createContext, forwardRef, useContext, useId, useMemo } from "react";
import * as RechartsPrimitive from "recharts";
import "./Charts.scss";

/**
 * @module Charts
 * A collection of chart components built on top of Recharts with enhanced styling and theming capabilities.
 */

/**
 * Available themes for chart customization
 * @constant
 * @type {Record<'light' | 'dark', string>}
 */
const THEMES = { light: "", dark: ".dark" } as const;

/**
 * Configuration type for chart elements
 */
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

/**
 * Context props for chart configuration
 */
type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = createContext<ChartContextProps | null>(null);

/**
 * Hook to access chart context
 * @throws Error if used outside of ChartContainer
 */
function useChart() {
  const context = useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

/**
 * Component that generates theme-specific styles for chart elements
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([_, config]) => config.theme || config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
    ${prefix} [data-chart=${id}] {
    ${colorConfig
      .map(([key, itemConfig]) => {
        const color =
          itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
      })
      .filter(Boolean)
      .join("\n")}
    }
    `,
          )
          .join("\n"),
      }}
    />
  );
};

/**
 * Container component for charts that provides configuration context and styling
 */
const ChartContainer = forwardRef<
  HTMLDivElement,
  ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={clsx("crayon-chart-container", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

/**
 * Re-exported Tooltip component from Recharts
 */
const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Custom tooltip content component with enhanced styling and formatting
 */
const ChartTooltipContent = forwardRef<
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

    return (
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
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

/**
 * Re-exported Legend component from Recharts
 */
const ChartLegend = RechartsPrimitive.Legend;

/**
 * Custom legend content component with enhanced styling
 */
const ChartLegendContent = forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();

  const payloadWithKeys = useMemo(
    () =>
      payload?.map((item) => ({
        ...item,
        uniqueKey: uniqueId(`chart-legend-${item.dataKey || item.value || ""}-`),
      })),
    [payload],
  );

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={clsx("crayon-chart-legend", `crayon-chart-legend--${verticalAlign}`, className)}
    >
      {payloadWithKeys?.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);

        return (
          <div key={item.uniqueKey} className="crayon-chart-legend-item">
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="crayon-chart-legend-item-indicator"
                style={{ backgroundColor: item.color }}
              />
            )}
            <span className="crayon-chart-legend-item-label">{itemConfig?.label}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

/**
 * Helper function to extract configuration for a chart element from a payload
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

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
