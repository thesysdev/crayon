import clsx from "clsx";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { ShellStoreProvider } from "../Shell/store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
  className?: string;
}

export const Container = ({ children, logoUrl, agentName, className }: ContainerProps) => {
  return (
    <ShellStoreProvider logoUrl={logoUrl} agentName={agentName}>
      <LayoutContextProvider layout="tray">
        <div className={clsx("crayon-copilot-shell-container", className)}>{children}</div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
