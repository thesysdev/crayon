import { useThreadListActions } from "@crayonai/react-core";
import clsx from "clsx";
import { Menu, Plus } from "lucide-react";
import { IconButton } from "../IconButton";
import { useShellStore } from "./store";

export const MobileHeader = ({ className }: { className?: string }) => {
  const { switchToNewThread } = useThreadListActions();
  const { logoUrl, agentName, setIsSidebarOpen } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  return (
    <div className={clsx("crayon-shell-mobile-header", className)}>
      <IconButton
        size="medium"
        icon={<Menu size="1em" />}
        onClick={() => setIsSidebarOpen(true)}
        variant="secondary"
      />
      <div className="crayon-shell-mobile-header-logo-container">
        <img className="crayon-shell-mobile-header-logo" src={logoUrl} alt="Logo" />
        <span className="crayon-shell-mobile-header-agent-name">{agentName}</span>
      </div>
      <IconButton
        size="medium"
        icon={<Plus size="1em" />}
        onClick={switchToNewThread}
        variant="secondary"
      />
    </div>
  );
};
