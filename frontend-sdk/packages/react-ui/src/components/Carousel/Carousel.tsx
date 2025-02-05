import clsx from "clsx";
import { createContext, forwardRef, useContext, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

interface CarouselContextType {
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
  scroll: (direction: "left" | "right") => void;
  itemsToScroll: number;
  noSnap?: boolean;
  showButtons?: boolean;
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
}

export const Carousel = forwardRef<HTMLDivElement, CarouselProps>(
  ({ itemsToScroll = 1, noSnap, showButtons = true, className, children, ...props }, ref) => {
    const scrollDivRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      if (scrollDivRef.current) {
        const container = scrollDivRef.current;
        let children = Array.from(container.children);

        const spacingEl = children.splice(0, 1)[0] as HTMLElement;

        if (noSnap) {
          children = Array.from(children[0]!.children);
        }

        const visibleIndex = children.findIndex((child) => {
          const rect = child.getBoundingClientRect();
          return rect.left >= container.getBoundingClientRect().left;
        });

        const targetIndex =
          direction === "left"
            ? Math.max(0, visibleIndex - itemsToScroll)
            : Math.min(children.length - 1, visibleIndex + itemsToScroll);

        const targetElement = (
          targetIndex === 0 ? spacingEl : children[targetIndex]
        ) as HTMLElement;

        if (targetElement) {
          container.scrollTo({
            left: targetElement.offsetLeft,
            behavior: "smooth",
          });
        }
      }
    };

    return (
      <CarouselContext.Provider
        value={{ scrollDivRef, scroll, itemsToScroll, noSnap, showButtons }}
      >
        <div className={clsx("crayon-carousel", className)} ref={ref} {...props}>
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
        <div />
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
        shape="circle"
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
          shape="circle"
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
