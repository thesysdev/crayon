import { createContext, useContext, useMemo } from "react";

export const LayoutContext = createContext<{
  isMobile: boolean;
  isFullScreen: boolean;
  isTray: boolean;
} | null>(null);

export const LayoutContextProvider = ({
  children,
  isTray,
  isFullScreen,
  isMobile,
}: {
  children: React.ReactNode;
  isTray: boolean;
  isFullScreen: boolean;
  isMobile: boolean;
}) => {
  const value = useMemo(
    () => ({ isMobile, isFullScreen, isTray }),
    [isMobile, isFullScreen, isTray],
  );
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  return context;
};
