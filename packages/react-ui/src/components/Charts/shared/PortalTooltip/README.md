# Floating Tooltip Components

A collection of components that provide mouse-following tooltips for charts using Floating UI for superior positioning and collision detection.

## Components

### FloatingUIPortal

A portal-based tooltip component that follows the mouse cursor and uses Floating UI for intelligent positioning.

```tsx
import { FloatingUIPortal } from "./FloatingUIPortal";

<FloatingUIPortal
  active={true}
  placement="right-start"
  offsetDistance={8}
  className="custom-tooltip"
>
  <div>Tooltip content</div>
</FloatingUIPortal>;
```

#### Props

- `active` (boolean): Whether the tooltip should be visible and active
- `children` (ReactNode): The content to display in the tooltip
- `placement` (Placement, optional): Floating UI placement option (default: "right-start")
- `offsetDistance` (number, optional): Distance from the mouse cursor (default: 8)
- `className` (string, optional): Additional CSS classes

#### Features

- **Mouse Following**: Tooltip follows mouse cursor in real-time
- **Smart Positioning**: Uses Floating UI's `flip`, `offset`, and `shift` middleware
- **Collision Detection**: Automatically adjusts position to stay on screen
- **Portal Rendering**: Renders outside the chart container to avoid clipping
- **Virtual Element**: Creates a virtual element that tracks mouse position

### CustomTooltipContent

A specialized tooltip content component that mirrors ChartTooltipContent but works with the floating tooltip system.

```tsx
import { CustomTooltipContent } from "./CustomTooltipContent";

<ChartTooltip content={<CustomTooltipContent />} />;
```

#### Props

Supports all the same props as `ChartTooltipContent`:

- `hideLabel` (boolean, optional): Hide the tooltip label
- `hideIndicator` (boolean, optional): Hide the color indicators
- `indicator` ("line" | "dot" | "dashed", optional): Indicator style
- `nameKey` (string, optional): Key for extracting item names
- `labelKey` (string, optional): Key for extracting labels
- `showPercentage` (boolean, optional): Show values as percentages
- `formatter` (function, optional): Custom value formatter
- `labelFormatter` (function, optional): Custom label formatter

#### Features

- **Consistent Styling**: Uses the same CSS classes as ChartTooltipContent
- **Full Feature Parity**: Supports all formatting and styling options
- **Floating UI Integration**: Automatically wraps content with FloatingUIPortal
- **Chart Context**: Access to chart configuration and styling

## Usage with AreaChartV2

The floating tooltip is integrated into AreaChartV2 via the `useFloatingTooltip` prop:

```tsx
import { AreaChartV2 } from "../AreaCharts/AreaChartV2";

<AreaChartV2
  data={chartData}
  categoryKey="month"
  useFloatingTooltip={true} // Enable floating tooltip
  theme="ocean"
  variant="natural"
  grid={true}
  legend={true}
/>;
```

## Implementation Details

### Virtual Element

The FloatingUIPortal creates a virtual element that implements Floating UI's positioning interface:

```tsx
const virtualElement: VirtualElement = {
  getBoundingClientRect(): DOMRect {
    return {
      width: 0,
      height: 0,
      x: mousePositionRef.current.x,
      y: mousePositionRef.current.y,
      top: mousePositionRef.current.y,
      left: mousePositionRef.current.x,
      right: mousePositionRef.current.x,
      bottom: mousePositionRef.current.y,
    } as DOMRect;
  },
};
```

### Mouse Tracking

Mouse position is tracked via global `mousemove` events and stored in a ref for performance:

```tsx
const handleMouseMove = (event: MouseEvent) => {
  mousePositionRef.current = {
    x: event.clientX,
    y: event.clientY,
  };
  updatePosition();
};
```

### Positioning

Uses Floating UI's middleware for intelligent positioning:

```tsx
const { x, y } = await computePosition(virtualElement, tooltipElement, {
  placement: "right-start",
  middleware: [
    offset(8), // Distance from cursor
    flip(), // Flip when hitting boundaries
    shift({ padding: 8 }), // Shift to stay in viewport
  ],
});
```

## Dependencies

- `@floating-ui/react-dom`: For positioning calculations
- `react-dom`: For portal functionality
- Existing chart components and styling

## Browser Support

Works in all modern browsers that support:

- React Portals
- CSS Custom Properties
- Mouse Events
- Async/Await

## Performance

- Uses `useRef` for mouse position to avoid re-renders
- Debounced position updates via `requestAnimationFrame`
- Minimal DOM manipulation
- Portal rendering prevents layout thrashing
