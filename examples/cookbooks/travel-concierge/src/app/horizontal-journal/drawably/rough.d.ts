export interface RoughOptions {
    seed: number;
    roughness: number;
    boil?: number;
    boilSeed?: number;
}
export type Pt = [number, number];
export declare function sampleLine(x1: number, y1: number, x2: number, y2: number, step?: number): Pt[];
export declare function ellipsePoints(cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n: number): Pt[];
export declare function jitter(points: Pt[], rand: () => number, amp: number): Pt[];
export declare function roughLine(x1: number, y1: number, x2: number, y2: number, o: RoughOptions): string;
export declare function roughCircle(cx: number, cy: number, r: number, o: RoughOptions): string;
export declare function roughEllipse(cx: number, cy: number, rx: number, ry: number, o: RoughOptions): string;
export declare function roughArrow(x1: number, y1: number, x2: number, y2: number, o: RoughOptions): string;
export declare function roughRoundedRect(x: number, y: number, w: number, h: number, r: number, o: RoughOptions): string;
export declare function roughCheckmark(x: number, y: number, w: number, h: number, o: RoughOptions): string;
export declare function scribbleFill(x: number, y: number, w: number, h: number, o: RoughOptions): string;
export declare function variants(gen: (o: RoughOptions) => string, o: RoughOptions, n?: number): string[];
