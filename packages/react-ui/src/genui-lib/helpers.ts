type ElementLike = {
  type: "element";
  props: Record<string, unknown>;
};

type ScatterPointLike = {
  x: number;
  y: number;
  z?: number;
};

type ScatterDatasetLike = {
  name: string;
  data: ScatterPointLike[];
};

type ChartPoint = Record<string, string | number>;

type NamedSeries = {
  category: string;
  values: number[];
};

type SliceDatum = {
  category: string;
  value: number;
};

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

export function hasAllProps(obj: Record<string, unknown>, ...keys: string[]): boolean {
  return keys.every((k) => obj[k] != null);
}

export function asArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function asElementNodes(v: unknown): ElementLike[] {
  return asArray(v).filter(
    (x): x is ElementLike =>
      typeof x === "object" && x !== null && (x as Record<string, unknown>)["type"] === "element",
  );
}

function unwrapProps(v: unknown): Record<string, unknown> {
  if (typeof v !== "object" || v === null) {
    return {};
  }

  if ((v as Record<string, unknown>)["type"] === "element") {
    const props = (v as Record<string, unknown>)["props"];
    if (typeof props === "object" && props !== null) {
      return props as Record<string, unknown>;
    }
  }

  return v as Record<string, unknown>;
}

function asStringArray(v: unknown): string[] | null {
  const values = asArray(v);
  if (values.length === 0) {
    return [];
  }

  if (!values.every((value) => typeof value === "string")) {
    return null;
  }

  return values;
}

function asFiniteNumber(v: unknown): number | null {
  if (typeof v === "number") {
    return Number.isFinite(v) ? v : null;
  }

  if (typeof v === "string" && v.trim() !== "") {
    const parsed = Number(v);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asNumberArray(v: unknown): number[] | null {
  const values = asArray(v);
  if (values.length === 0) {
    return [];
  }

  const normalized: number[] = [];
  for (const value of values) {
    const parsed = asFiniteNumber(value);
    if (parsed === null) {
      return null;
    }
    normalized.push(parsed);
  }

  return normalized;
}

export function buildChartData(labels: unknown, series: unknown): ChartPoint[] {
  const lbls = asStringArray(labels);
  if (lbls === null || lbls.length === 0) {
    return [];
  }

  // Tabular format: labels = column names, series = 2D rows from Query results
  // e.g. AreaChart(data.columns, data.results) where columns=["day","views","users"]
  // and results=[["Mon",100,50],["Tue",200,75]]
  const rows = asArray(series);
  if (rows.length > 0 && Array.isArray(rows[0])) {
    // Column 0 = category labels, columns 1+ = series values
    const seriesNames = lbls.slice(1);
    if (seriesNames.length === 0) {
      return [];
    }

    const tabularData = rows.map((row): ChartPoint | null => {
      if (!Array.isArray(row)) {
        return null;
      }

      const cells = row as unknown[];
      if (cells.length < lbls.length || cells[0] == null) {
        return null;
      }

      const point: ChartPoint = { category: String(cells[0]) };
      seriesNames.forEach((name, si) => {
        const val = asFiniteNumber(cells[si + 1]);
        if (val === null) {
          point[name] = Number.NaN;
          return;
        }
        point[name] = val;
      });

      if (seriesNames.some((name) => !Number.isFinite(point[name] as number))) {
        return null;
      }

      return point;
    });

    if (tabularData.some((point) => point === null)) {
      return [];
    }

    return tabularData.filter(isDefined);
  }

  // Original format: labels = x-axis values, series = Series() elements
  const seriesNodes = asElementNodes(series);
  if (seriesNodes.length === 0) {
    return [];
  }

  const normalizedSeries = seriesNodes.map((node): NamedSeries | null => {
    const category = node.props["category"];
    const values = asNumberArray(node.props["values"]);

    if (typeof category !== "string" || values === null || values.length !== lbls.length) {
      return null;
    }

    return { category, values };
  });

  if (normalizedSeries.some((entry) => entry === null)) {
    return [];
  }

  const seriesData = normalizedSeries.filter(isDefined);

  return lbls.map((label, i) => {
    const point: ChartPoint = { category: label };
    seriesData.forEach((entry) => {
      point[entry.category] = entry.values[i]!;
    });
    return point;
  });
}

export function buildLabeledValueData(labels: unknown, values: unknown): ChartPoint[] {
  const categories = asStringArray(labels);
  const normalizedValues = asNumberArray(values);

  if (
    categories === null ||
    normalizedValues === null ||
    categories.length === 0 ||
    categories.length !== normalizedValues.length
  ) {
    return [];
  }

  return categories.map((category, index) => ({
    category,
    value: normalizedValues[index]!,
  }));
}

export function buildSliceData(slices: unknown): Record<string, string | number>[] {
  const sliceNodes = asElementNodes(slices);
  if (sliceNodes.length === 0) {
    return [];
  }

  const normalizedSlices = sliceNodes.map((slice): SliceDatum | null => {
    const category = slice.props["category"];
    const value = asFiniteNumber(slice.props["value"]);

    if (typeof category !== "string" || value === null) {
      return null;
    }

    return { category, value };
  });

  if (normalizedSlices.some((slice) => slice === null)) {
    return [];
  }

  return normalizedSlices.filter(isDefined);
}

export function buildScatterChartData(datasets: unknown): ScatterDatasetLike[] {
  const rawDatasets = asArray(datasets);
  if (rawDatasets.length === 0) {
    return [];
  }

  const normalizedDatasets = rawDatasets.map((dataset): ScatterDatasetLike | null => {
    const datasetProps = unwrapProps(dataset);
    const name = datasetProps["name"];
    const rawPoints = asArray(datasetProps["points"]);

    if (typeof name !== "string" || rawPoints.length === 0) {
      return null;
    }

    const points = rawPoints.map((point) => {
      const pointProps = unwrapProps(point);
      const x = asFiniteNumber(pointProps["x"]);
      const y = asFiniteNumber(pointProps["y"]);
      const rawZ = pointProps["z"];

      if (x === null || y === null) {
        return null;
      }

      if (rawZ == null) {
        return { x, y };
      }

      const z = asFiniteNumber(rawZ);
      if (z === null) {
        return null;
      }

      return { x, y, z };
    });

    if (points.some((point) => point === null)) {
      return null;
    }

    return {
      name,
      data: points as ScatterPointLike[],
    };
  });

  if (normalizedDatasets.some((dataset) => dataset === null)) {
    return [];
  }

  return normalizedDatasets.filter(isDefined);
}
