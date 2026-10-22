// Host elements for the React Native build — same exports as host.tsx, built
// from react-native primitives. Metro has no <div>/<button>, so the native
// build resolves `./host` here (see tsdown.config.ts).
import type { ComponentPropsWithRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

/** Default query loader: a small spinner pinned to the top-right corner. */
export function QuerySpinner() {
  return (
    <ActivityIndicator
      size="small"
      color="#3b82f6"
      aria-label="Loading data"
      style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}
    />
  );
}

export type HostViewProps = ComponentPropsWithRef<typeof View> & {
  /** Fades content while queries load. Omit to leave opacity untouched. */
  dimmed?: boolean;
  /** Hides the view while keeping its children mounted (the web `hidden` attribute). */
  hidden?: boolean;
};

export function HostView({ dimmed, hidden, style, ...props }: HostViewProps) {
  return (
    <View
      {...props}
      style={[
        dimmed !== undefined && { opacity: dimmed ? 0.7 : 1 },
        hidden && { display: "none" },
        style,
      ]}
    />
  );
}

export type HostButtonProps = ComponentPropsWithRef<typeof Pressable>;

/** A button that runs `onActivate` unless disabled or the press handler calls preventDefault(). */
export function HostButton({
  onActivate,
  controls: _controls,
  onPress,
  disabled,
  children,
  ...props
}: HostButtonProps & { onActivate: () => void; controls?: string }) {
  return (
    <Pressable
      role="button"
      {...props}
      disabled={disabled}
      onPress={(event) => {
        if (disabled || event.isDefaultPrevented()) return;
        onPress?.(event);
        if (!event.isDefaultPrevented()) onActivate();
      }}
    >
      {/* Raw strings must sit inside <Text> on native. */}
      {typeof children === "string" || typeof children === "number" ? (
        <Text>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export type HostRegionProps = ComponentPropsWithRef<typeof View>;

export function HostRegion({ style, ...props }: HostRegionProps) {
  return <View {...props} style={[{ position: "relative" }, style]} />;
}
