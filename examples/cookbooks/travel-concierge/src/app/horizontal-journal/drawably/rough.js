import { mulberry32 } from "./prng.js";
export function sampleLine(x1, y1, x2, y2, step = 8) {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
    return Array.from({ length: n + 1 }, (_, i) => [
        x1 + ((x2 - x1) * i) / n,
        y1 + ((y2 - y1) * i) / n,
    ]);
}
function arcPoints(cx, cy, r, a0, a1, n = 4) {
    return ellipsePoints(cx, cy, r, r, a0, a1, n);
}
export function ellipsePoints(cx, cy, rx, ry, a0, a1, n) {
    return Array.from({ length: n + 1 }, (_, i) => {
        const a = a0 + ((a1 - a0) * i) / n;
        return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    });
}
function roundedRectPoints(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    return [
        ...sampleLine(x + r, y, x + w - r, y),
        ...arcPoints(x + w - r, y + r, r, -Math.PI / 2, 0),
        ...sampleLine(x + w, y + r, x + w, y + h - r),
        ...arcPoints(x + w - r, y + h - r, r, 0, Math.PI / 2),
        ...sampleLine(x + w - r, y + h, x + r, y + h),
        ...arcPoints(x + r, y + h - r, r, Math.PI / 2, Math.PI),
        ...sampleLine(x, y + h - r, x, y + r),
        ...arcPoints(x + r, y + r, r, Math.PI, Math.PI * 1.5),
    ];
}
export function jitter(points, rand, amp) {
    return points.map(([x, y]) => [x + (rand() * 2 - 1) * amp, y + (rand() * 2 - 1) * amp]);
}
function toPath(points, close) {
    let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
    for (let i = 1; i < points.length - 1; i++) {
        const [cx, cy] = points[i];
        const mx = (cx + points[i + 1][0]) / 2;
        const my = (cy + points[i + 1][1]) / 2;
        d += `Q${cx.toFixed(2)} ${cy.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
    }
    const [lx, ly] = points[points.length - 1];
    d += `L${lx.toFixed(2)} ${ly.toFixed(2)}`;
    return close ? d + "Z" : d;
}
function boilPass(points, o) {
    if (!o.boil || o.boilSeed === undefined)
        return points;
    return jitter(points, mulberry32(o.boilSeed), o.boil);
}
function doubleStroke(points, o, close) {
    const rand = mulberry32(o.seed);
    const amp = 1.5 * o.roughness;
    return (toPath(boilPass(jitter(points, rand, amp), o), close) +
        toPath(boilPass(jitter(points, rand, amp * 1.4), o), close));
}
export function roughLine(x1, y1, x2, y2, o) {
    return doubleStroke(sampleLine(x1, y1, x2, y2), o, false);
}
export function roughCircle(cx, cy, r, o) {
    return roughEllipse(cx, cy, r, r, o);
}
export function roughEllipse(cx, cy, rx, ry, o) {
    // Ramanujan's perimeter approximation, sampled every 8px like the lines
    const h = ((rx - ry) / (rx + ry)) ** 2;
    const perimeter = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
    const n = Math.max(8, Math.ceil(perimeter / 8));
    return doubleStroke(ellipsePoints(cx, cy, rx, ry, 0, Math.PI * 2, n).slice(0, -1), o, true);
}
const ARROW_HEAD = 12;
const ARROW_HEAD_ANGLE = Math.PI / 6;
export function roughArrow(x1, y1, x2, y2, o) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const wing = (da) => [
        x2 - ARROW_HEAD * Math.cos(a + da),
        y2 - ARROW_HEAD * Math.sin(a + da),
    ];
    const [lx, ly] = wing(ARROW_HEAD_ANGLE);
    const [rx, ry] = wing(-ARROW_HEAD_ANGLE);
    const rand = mulberry32(o.seed);
    const amp = 1.2 * o.roughness;
    const head = (px, py) => toPath(boilPass(jitter(sampleLine(x2, y2, px, py, 4), rand, amp), o), false);
    return roughLine(x1, y1, x2, y2, o) + head(lx, ly) + head(rx, ry);
}
export function roughRoundedRect(x, y, w, h, r, o) {
    return doubleStroke(roundedRectPoints(x, y, w, h, r), o, true);
}
export function roughCheckmark(x, y, w, h, o) {
    const rand = mulberry32(o.seed);
    const pts = [
        ...sampleLine(x, y + h * 0.6, x + w * 0.35, y + h, 4),
        // ponytail: duplicate vertex keeps the corner sharp under midpoint smoothing
        ...sampleLine(x + w * 0.35, y + h, x + w, y, 4),
    ];
    return toPath(boilPass(jitter(pts, rand, 1.2 * o.roughness), o), false);
}
export function scribbleFill(x, y, w, h, o) {
    const rand = mulberry32(o.seed);
    const gap = 6;
    const pts = [];
    let flip = false;
    for (let t = gap; t < w + h; t += gap) {
        const a = [x + Math.max(0, t - h), y + Math.min(t, h)];
        const b = [x + Math.min(t, w), y + Math.max(0, t - w)];
        pts.push(...(flip ? [b, a] : [a, b]));
        flip = !flip;
    }
    if (pts.length < 2)
        return "";
    return toPath(boilPass(jitter(pts, rand, 1.2 * o.roughness), o), false);
}
export function variants(gen, o, n = 3) {
    return Array.from({ length: n }, (_, i) => gen({ ...o, boilSeed: o.seed + (i + 1) * 7919 }));
}
