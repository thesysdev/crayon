import clsx from "clsx";
import { createContext, forwardRef, useContext, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

interface CarouselContextType {
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
  scroll: (direction: "left" | "right") => void;
  itemsToScroll: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
 
}

const CarouselContext = createContext<CarouselContextType | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a Carousel");
  return context;
};

export interface CarouselProviderProps {
  children: React.ReactNode;
  itemsToScroll?: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
  // buttonBehavior?: "hide" | "disable";
}

export const CarouselProvider = ({
  children,
  itemsToScroll = 1,
  noSnap,
  showButtons = true,
  variant = "card",
  // buttonBehavior = "hide",
}: CarouselProviderProps) => {
  const scrollDivRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollDivRef.current) {
      return;
    }

    const container = scrollDivRef.current;
    const items = noSnap
      ? Array.from(container.children[0]?.children ?? [])
      : Array.from(container.children);

    if (items.length === 0) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const visibleIndex = items.findIndex((child) => {
      const rect = child.getBoundingClientRect();
      return rect.left >= containerRect.left;
    });

    let currentIndex = visibleIndex;
    if (visibleIndex === -1) {
      // Scrolled to the far right, so the last item is the current one
      currentIndex = items.length - 1;
    }

    const targetIndex =
      direction === "left"
        ? Math.max(0, currentIndex - itemsToScroll)
        : Math.min(items.length - 1, currentIndex + itemsToScroll);

    const targetElement = items[targetIndex] as HTMLElement;

    if (targetElement) {
      container.scrollTo({
        left: targetElement.offsetLeft,
        behavior: "smooth",
      });
    }
  };

  return (
    <CarouselContext.Provider
      value={{
        scrollDivRef,
        scroll,
        itemsToScroll,
        noSnap,
        showButtons,
        variant,
      }}
    >
      {children}
    </CarouselContext.Provider>
  );
};

export const Carousel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { variant } = useCarousel();
    return (
      <div
        className={clsx("crayon-carousel", `crayon-carousel--${variant}`, className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Carousel.displayName = "Carousel";

export const CarouselContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, _ref) => {
    const { scrollDivRef, noSnap } = useCarousel();

    const content = noSnap ? (
      <div className="crayon-carousel-content-wrapper">{children}</div>
    ) : (
      children
    );

    return (
      <div ref={scrollDivRef} className={clsx("crayon-carousel-content", className)} {...props}>
        {content}
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

export const CarouselItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("crayon-carousel-item", className)} {...props}>
      {children}
    </div>
  ),
);
CarouselItem.displayName = "CarouselItem";

export const CarouselWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("crayon-carousel-wrapper", className)} {...props}>
      {children}
    </div>
  ),
);
CarouselWrapper.displayName = "CarouselWrapper";

export interface CarouselPreviousProps extends React.ComponentProps<typeof IconButton> {
  buttonBehavior?: "hide" | "disable";
}

export const CarouselPrevious = forwardRef<HTMLButtonElement, CarouselPreviousProps>(
  ({ className, style, buttonBehavior = "hide", ...props }, ref) => {
    const { scrollDivRef, scroll, showButtons } = useCarousel();
    const [show, setShow] = useState(true);

    useEffect(() => {
      if (!scrollDivRef.current) return;

      const container = scrollDivRef.current;
      const shouldShow = () => container.scrollLeft > 0;

      setShow(shouldShow());

      const handleScroll = () => {
        setShow(shouldShow());
      };

      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(container);

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
      };
    }, [scrollDivRef]);

    if (!showButtons) return null;

    return (
      <div
        className={clsx(
          "crayon-carousel-button crayon-carousel-button-left",
          { "crayon-carousel-button--hidden": buttonBehavior === "hide" && !show },
          { "crayon-carousel-button--disabled": buttonBehavior === "disable" && !show },
          className,
        )}
      >
        <IconButton
          ref={ref}
          variant="secondary"
          shape="square"
          size="small"
          onClick={() => scroll("left")}
          style={style}
          disabled={buttonBehavior === "disable" && !show}
          {...props}
        />
      </div>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

export interface CarouselNextProps extends React.ComponentProps<typeof IconButton> {
  buttonBehavior?: "hide" | "disable";
}

export const CarouselNext = forwardRef<HTMLButtonElement, CarouselNextProps>(
  ({ className, style, buttonBehavior = "hide", ...props }, ref) => {
    const { scrollDivRef, scroll, showButtons } = useCarousel();
    const [show, setShow] = useState(true);

    useEffect(() => {
      if (!scrollDivRef.current) return;

      const container = scrollDivRef.current;
      const shouldShow = () => container.scrollLeft + container.offsetWidth < container.scrollWidth;

      setShow(shouldShow());

      const handleScroll = () => {
        setShow(shouldShow());
      };

      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(container);

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
      };
    }, [scrollDivRef]);

    if (!showButtons) return null;

    return (
      <div
        className={clsx(
          "crayon-carousel-button crayon-carousel-button-right",
          { "crayon-carousel-button--hidden": buttonBehavior === "hide" && !show },
          { "crayon-carousel-button--disabled": buttonBehavior === "disable" && !show },
          className,
        )}
      >
        <IconButton
          ref={ref}
          variant="secondary"
          shape="square"
          size="small"
          onClick={() => scroll("right")}
          style={style}
          disabled={buttonBehavior === "disable" && !show}
          {...props}
        />
      </div>
    );
  },
);
CarouselNext.displayName = "CarouselNext";
