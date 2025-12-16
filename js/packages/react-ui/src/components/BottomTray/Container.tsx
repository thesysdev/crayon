import clsx from "clsx";
import { LayoutContextProvider } from "../../context/LayoutContext";
import { ShellStoreProvider } from "../Shell/store";

interface ContainerProps {
  children?: React.ReactNode;
  logoUrl: string;
  agentName: string;
  className?: string;
  /** Control the open state of the tray */
  isOpen?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

export const Container = ({
  children,
  logoUrl,
  agentName,
  className,
  isOpen = false,
}: ContainerProps) => {
  return (
    <ShellStoreProvider logoUrl={logoUrl} agentName={agentName}>
      <LayoutContextProvider layout="tray">
        <div
          className={clsx(
            "crayon-bottom-tray-container",
            {
              "crayon-bottom-tray-container--open": isOpen,
              "crayon-bottom-tray-container--closed": !isOpen,
            },
            className,
          )}
        >
          {children}
        </div>
      </LayoutContextProvider>
    </ShellStoreProvider>
  );
};
