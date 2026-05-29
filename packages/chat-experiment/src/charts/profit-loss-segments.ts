type SegmentSign = "positive" | "negative";

export interface ProfitLossSegment {
  data: Record<string, unknown>[];
  isPositive: boolean;
}

function resolveSign(value: number, fallback: SegmentSign): SegmentSign {
  if (value > 0) {
    return "positive";
  }
  if (value < 0) {
    return "negative";
  }
  return fallback;
}

function findInitialSign(data: Record<string, unknown>[], dataKey: string): SegmentSign {
  for (const row of data) {
    const value = row[dataKey];
    if (typeof value !== "number") {
      continue;
    }
    if (value > 0) {
      return "positive";
    }
    if (value < 0) {
      return "negative";
    }
  }
  return "positive";
}

function interpolateZeroCrossing(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  dataKey: string,
  xDataKey: string,
  xAccessor: (d: Record<string, unknown>) => Date,
): Record<string, unknown> {
  const ya = a[dataKey] as number;
  const yb = b[dataKey] as number;
  const t = ya / (ya - yb);
  const start = xAccessor(a).getTime();
  const end = xAccessor(b).getTime();
  const crossDate = new Date(start + t * (end - start));

  return {
    ...a,
    [xDataKey]: crossDate,
    [dataKey]: 0,
  };
}

/** Split a single series into contiguous segments above/below zero. */
export function splitProfitLossSegments({
  data,
  dataKey,
  xDataKey = "date",
  xAccessor,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xDataKey?: string;
  xAccessor: (d: Record<string, unknown>) => Date;
}): ProfitLossSegment[] {
  if (data.length === 0) {
    return [];
  }

  const segments: ProfitLossSegment[] = [];
  let currentSign = findInitialSign(data, dataKey);
  const firstPoint = data[0];
  if (!firstPoint) {
    return [];
  }
  let currentSegment: Record<string, unknown>[] = [firstPoint];

  for (let i = 0; i < data.length - 1; i++) {
    const a = data[i];
    const b = data[i + 1];
    if (!(a && b)) {
      continue;
    }
    const ya = a[dataKey] as number;
    const yb = b[dataKey] as number;

    if (
      typeof ya === "number" &&
      typeof yb === "number" &&
      ya !== 0 &&
      yb !== 0 &&
      Math.sign(ya) !== Math.sign(yb)
    ) {
      const cross = interpolateZeroCrossing(a, b, dataKey, xDataKey, xAccessor);
      currentSegment.push(cross);
      segments.push({
        data: currentSegment,
        isPositive: currentSign === "positive",
      });
      currentSegment = [cross, b];
      currentSign = resolveSign(yb, currentSign);
      continue;
    }

    currentSegment.push(b);
    if (typeof yb === "number" && yb !== 0) {
      currentSign = resolveSign(yb, currentSign);
    }
  }

  if (currentSegment.length > 0) {
    segments.push({
      data: currentSegment,
      isPositive: currentSign === "positive",
    });
  }

  return segments;
}
