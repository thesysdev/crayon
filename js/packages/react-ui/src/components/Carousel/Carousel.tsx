import clsx from "clsx";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
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
      ...props
    },
    ref,
  ) => {
    const scrollDivRef = useRef<HTMLDivElement>(null);

    const scroll = useCallback((direction: "left" | "right") => {
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
    }, []);

    useImperativeHandle(ref, () => {
      return {
        scroll,
        scrollDivRef,
      };
    }, []);

    return (
      <CarouselContext.Provider
        value={{ scrollDivRef, scroll, itemsToScroll, noSnap, showButtons, variant }}
      >
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

export const CarouselItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("crayon-carousel-item", className)} {...props}>
      {children}
    </div>
  ),
);

export const CarouselPrevious = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton>
>(({ className, style, ...props }, ref) => {
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

  if (!show || !showButtons) return null;

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

    if (!show || !showButtons) return null;

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
