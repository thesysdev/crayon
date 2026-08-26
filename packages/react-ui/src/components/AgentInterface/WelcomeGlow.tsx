import clsx from "clsx";
import { createContext, useContext, type ReactNode } from "react";

const WelcomeGlowContext = createContext(false);

export const WelcomeGlowProvider = ({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) => <WelcomeGlowContext.Provider value={enabled}>{children}</WelcomeGlowContext.Provider>;

export interface WelcomeGlowProps {
  children: ReactNode;
  className?: string;
}

/**
 * Positions the optional welcome glow around a custom composer. The animation
 * is enabled by the nearest <AgentInterface.Welcome glowAnimation> ancestor.
 */
export const WelcomeGlow = ({ children, className }: WelcomeGlowProps) => {
  const enabled = useContext(WelcomeGlowContext);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className={clsx("openui-agent-welcome-glow", className)}>
      <span
        aria-hidden="true"
        className="openui-agent-welcome-glow__blob openui-agent-welcome-glow__blob--accent"
      />
      <span
        aria-hidden="true"
        className="openui-agent-welcome-glow__blob openui-agent-welcome-glow__blob--foreground"
      />
      {children}
    </div>
  );
};
