import clsx from "clsx";
import { forwardRef } from "react";
import { useShellStore } from "../Shell/store";

export const Header = forwardRef<HTMLDivElement>(({ className }: { className?: string }, ref) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  return (
    <div className={clsx("crayon-copilot-shell-header", className)} ref={ref}>
      <div className="crayon-copilot-shell-header-logo-container">
        <img className="crayon-copilot-shell-header-logo" src={logoUrl} alt="Logo" />
        <span className="crayon-copilot-shell-header-agent-name">{agentName}</span>
      </div>
    </div>
  );
});
