import clsx from "clsx";
import { useShellStore } from "../Shell/store";

export const Header = ({ className }: { className?: string }) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  return (
    <div className={clsx("crayon-copilot-shell-header", className)}>
      <div className="crayon-copilot-shell-header-logo-container">
        <img className="crayon-copilot-shell-header-logo" src={logoUrl} alt="Logo" />
        <span className="crayon-copilot-shell-header-agent-name">{agentName}</span>
      </div>
    </div>
  );
};
