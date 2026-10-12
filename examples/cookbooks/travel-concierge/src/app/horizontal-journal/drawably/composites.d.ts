import { type DrawablyBadgeOptions, type DrawablyOptions, type Sketch } from "./controls.js";
export declare function drawablyChip(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export interface DrawablyTabsOptions extends DrawablyOptions {
    active?: number;
}
export interface TabsSketch extends Sketch {
    setActive(index: number): void;
}
export declare function drawablyTabs(el: HTMLElement, opts?: DrawablyTabsOptions): TabsSketch;
export declare function drawablyTooltip(tip: HTMLElement, target: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyAlert(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablySteps(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyKbd(el: HTMLElement, opts?: DrawablyBadgeOptions): Sketch;
export declare function drawablyQuote(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export interface DrawablyPagerOptions extends DrawablyOptions {
    active?: number;
}
export interface PagerSketch extends Sketch {
    setPage(index: number): void;
}
export declare function drawablyPager(el: HTMLElement, opts?: DrawablyPagerOptions): PagerSketch;
