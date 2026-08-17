import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LineInBarShape } from "./LineInBarShape";

const validGeometry = {
  x: 10,
  y: 20,
  width: 100,
  height: 24,
  orientation: "horizontal" as const,
};

describe("LineInBarShape", () => {
  it("renders finite SVG geometry", () => {
    const markup = renderToStaticMarkup(<LineInBarShape {...validGeometry} />);

    expect(markup).toContain("<path");
    expect(markup).toContain("<line");
    expect(markup).not.toContain("NaN");
  });

  it.each(["x", "y", "width", "height"] as const)(
    "skips rendering when %s is not finite",
    (dimension) => {
      const markup = renderToStaticMarkup(
        <LineInBarShape {...validGeometry} {...{ [dimension]: Number.NaN }} />,
      );

      expect(markup).toBe("");
    },
  );
});
