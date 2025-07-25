import clsx from "clsx";
import { ChevronLeft, ChevronRight, LayoutPanelTop, Table } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton/IconButton";

interface DataCardProps {
  data: DataObject;
}

export const DataCard = ({ data }: DataCardProps) => {
  const fields = Object.keys(data).filter((key) => key.toLowerCase() !== "name");

  return (
    <div className="data-card-container">
      <div className="data-card-header">{data["name"]}</div>
      <div className="data-card-content">
        {fields.map((key) => (
          <div className="data-card-field" key={key}>
            <div className="data-card-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
            <div className="data-card-value">{data[key]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface DataObject {
  [key: string]: string | number | boolean | React.ReactNode;
}

interface DataTableProps {
  tableTitle?: string;
  headers: string[];
  data: DataObject[];
}

export const DataTable = ({ tableTitle = "Data Table", headers, data }: DataTableProps) => {
  const [layout, setLayout] = useState<"table" | "card">("table");
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = tableContainerRef.current;
    if (container) {
      const hasHorizontalScrollbar = container.scrollWidth > container.clientWidth;
      setIsOverflowing(hasHorizontalScrollbar);
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        hasHorizontalScrollbar &&
          Math.ceil(container.scrollLeft) < container.scrollWidth - container.clientWidth,
      );
    }
  }, []);

  useLayoutEffect(() => {
    const container = tableContainerRef.current;
    if (layout !== "table" || !container) {
      setIsOverflowing(false);
      return;
    }

    const observer = new ResizeObserver(() => {
      updateScrollState();
    });

    observer.observe(container);

    const table = container.querySelector("table");
    if (table) {
      observer.observe(table);
    }

    container.addEventListener("scroll", updateScrollState, { passive: true });
    updateScrollState();

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", updateScrollState);
    };
  }, [layout, data, updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    const container = tableContainerRef.current;
    if (container) {
      const ths = container.querySelectorAll<HTMLTableCellElement>("table thead tr th");
      if (!ths.length) return;

      const columnPositions = [0];
      let accumulatedWidth = 0;
      Array.from(ths).forEach((th) => {
        accumulatedWidth += th.offsetWidth;
        columnPositions.push(accumulatedWidth);
      });
      const startPositions = columnPositions.slice(0, -1);

      const currentScrollLeft = container.scrollLeft;

      if (direction === "right") {
        const targetPosition = startPositions.find((pos) => pos > currentScrollLeft + 1);
        if (targetPosition !== undefined) {
          container.scrollTo({ left: targetPosition, behavior: "smooth" });
        }
      } else {
        const targetPosition = [...startPositions]
          .reverse()
          .find((pos) => pos < currentScrollLeft - 1);
        if (targetPosition !== undefined) {
          container.scrollTo({ left: targetPosition, behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className={`data-table-container ${layout === "card" ? "card-layout" : ""}`}>
      <div className="data-table-header">
        <div className="data-table-title">
          <span className="data-table-title-text">{tableTitle}</span>
        </div>
        <div className="data-table-actions">
          <IconButton
            icon={<Table />}
            size="small"
            onClick={() => setLayout("table")}
            variant={layout === "table" ? "primary" : "tertiary"}
          />
          <IconButton
            icon={<LayoutPanelTop />}
            size="small"
            onClick={() => setLayout("card")}
            variant={layout === "card" ? "primary" : "tertiary"}
          />
        </div>
      </div>
      <div className="data-table-content">
        {layout === "table" && isOverflowing && (
          <div className="data-table-scroll-buttons">
            <IconButton
              className={clsx("data-table-scroll-button", "data-table-scroll-button--left", {
                "data-table-scroll-button--disabled": !canScrollLeft,
              })}
              icon={<ChevronLeft />}
              variant="secondary"
              onClick={() => handleScroll("left")}
              size="small"
              disabled={!canScrollLeft}
            />
            <IconButton
              className={clsx("data-table-scroll-button", "data-table-scroll-button--right", {
                "data-table-scroll-button--disabled": !canScrollRight,
              })}
              icon={<ChevronRight />}
              variant="secondary"
              size="small"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
            />
          </div>
        )}
        <div className="data-table-table-container" ref={tableContainerRef}>
          <table>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header) => {
                    const key = header.toLowerCase();
                    return <td key={key}>{row[key]}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-table-layout-container">
          {data.map((row, rowIndex) => (
            <DataCard key={rowIndex} data={row} />
          ))}
        </div>
      </div>
    </div>
  );
};
