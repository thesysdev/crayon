import clsx from "clsx";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconButton } from "../IconButton";

interface CarouselContextType {
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
  scroll: (direction: "left" | "right") => void;
  itemsToScroll: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
  isPrevVisible: boolean;
  isNextVisible: boolean;
}

const CarouselContext = createContext<CarouselContextType | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a Carousel");
  return context;
};

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  itemsToScroll?: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
  onScrollLeftEnabled?: (enabled: boolean) => void;
  onScrollRightEnabled?: (enabled: boolean) => void;
}

export interface CarouselRef {
  scroll: (direction: "left" | "right") => void;
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
}

export const Carousel = forwardRef<CarouselRef, CarouselProps>(
  (
    {
      itemsToScroll = 1,
      noSnap,
      showButtons = true,
      variant = "card",
      className,
      children,
      onScrollLeftEnabled,
      onScrollRightEnabled,
      ...props
    },
    ref,
  ) => {
    const scrollDivRef = useRef<HTMLDivElement>(null);
    const [isPrevVisible, setIsPrevVisible] = useState(false);
    const [isNextVisible, setIsNextVisible] = useState(false);

    const updateScrollButtons = useCallback(() => {
      if (!scrollDivRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollDivRef.current;
      const canScrollLeft = scrollLeft > 0;
      // Use a 1px buffer to account for subpixel rendering, which can cause calculation errors.
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1;
      setIsPrevVisible(canScrollLeft);
      setIsNextVisible(canScrollRight);
    }, []);

    const scroll = useCallback(
      (direction: "left" | "right") => {
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

        let closestIndex = 0;
        let minDistance = Infinity;
        items.forEach((child, index) => {
          const rect = child.getBoundingClientRect();
          const distance = Math.abs(rect.left - containerRect.left);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        const targetIndex =
          direction === "left"
            ? Math.max(0, closestIndex - itemsToScroll)
            : Math.min(items.length - 1, closestIndex + itemsToScroll);

        const targetElement = items[targetIndex] as HTMLElement;

        if (targetElement) {
          container.scrollTo({
            left: targetElement.offsetLeft,
            behavior: "smooth",
          });
        }
      },
      [noSnap, itemsToScroll],
    );

    useEffect(() => {
      if (!scrollDivRef.current) return;

      const container = scrollDivRef.current;
      const handleScroll = () => {
        updateScrollButtons();
      };

      updateScrollButtons();

      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(container);
      const mutationObserver = new MutationObserver(handleScroll);
      mutationObserver.observe(container, { childList: true, subtree: true });

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, []);

    useEffect(() => {
      onScrollLeftEnabled?.(isPrevVisible);
    }, [isPrevVisible, onScrollLeftEnabled]);

    useEffect(() => {
      onScrollRightEnabled?.(isNextVisible);
    }, [isNextVisible, onScrollRightEnabled]);

    useImperativeHandle(ref, () => {
      return {
        scroll,
        scrollDivRef,
      };
    }, [scroll]);

    const contextValue = useMemo(
      () => ({
        scrollDivRef,
        scroll,
        itemsToScroll,
        noSnap,
        showButtons,
        variant,
        isPrevVisible,
        isNextVisible,
      }),
      [
        scrollDivRef,
        scroll,
        itemsToScroll,
        noSnap,
        showButtons,
        variant,
        isPrevVisible,
        isNextVisible,
      ],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          className={clsx("crayon-carousel", `crayon-carousel--${variant}`, className)}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);

export const CarouselContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, _ref) => {
    const { scrollDivRef, noSnap, isPrevVisible, isNextVisible } = useCarousel();

    const content = noSnap ? (
      <div className="crayon-carousel-content-wrapper">{children}</div>
    ) : (
      children
    );

    return (
      <div
        ref={scrollDivRef}
        className={clsx(
          "crayon-carousel-content",
          {
            "crayon-carousel-content--mask-left": isPrevVisible,
            "crayon-carousel-content--mask-right": isNextVisible,
          },
          className,
        )}
        {...props}
      >
        {content}
      </div>
    );
  },
);

export const CarouselItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { actions?: React.ReactNode }
>(({ className, children, actions, ...props }, ref) => (
  <div ref={ref} className={clsx("crayon-carousel-item", className)} {...props}>
    <div className="crayon-carousel-item-content">{children}</div>
    {actions && <div className="crayon-carousel-item-actions">{actions}</div>}
  </div>
));

export const CarouselPrevious = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton>
>(({ className, style, ...props }, ref) => {
  const { scroll, showButtons, isPrevVisible } = useCarousel();

  if (!isPrevVisible || !showButtons) return null;

  return (
    <div className={clsx("crayon-carousel-button crayon-carousel-button-left", className)}>
      <IconButton
        ref={ref}
        shape="square"
        variant="secondary"
        size="small"
        onClick={() => scroll("left")}
        style={style}
        {...props}
      />
    </div>
  );
});

export const CarouselNext = forwardRef<HTMLButtonElement, React.ComponentProps<typeof IconButton>>(
  ({ className, style, ...props }, ref) => {
    const { scroll, showButtons, isNextVisible } = useCarousel();

    if (!isNextVisible || !showButtons) return null;

    return (
      <div className={clsx("crayon-carousel-button crayon-carousel-button-right", className)}>
        <IconButton
          ref={ref}
          shape="square"
          variant="secondary"
          size="small"
          onClick={() => scroll("right")}
          style={style}
          {...props}
        />
      </div>
    );
  },
);
