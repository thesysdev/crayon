export interface DrawablyOptions {
    seed?: number;
    roughness?: number;
    boil?: number;
    stroke?: string;
    fill?: string;
    paper?: string;
    width?: number;
}
export interface Sketch {
    resketch(seed?: number): void;
    destroy(): void;
}
export type DrawablyButtonState = "idle" | "loading" | "error" | "success";
export interface DrawablyButtonOptions extends DrawablyOptions {
    variant?: "outline" | "solid" | "scribble";
    state?: DrawablyButtonState;
    tone?: "neutral" | "danger";
}
export interface ButtonSketch extends Sketch {
    setState(state: DrawablyButtonState): void;
}
export declare function drawablyButton(el: HTMLElement, opts?: DrawablyButtonOptions): ButtonSketch;
export declare function drawablyCard(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyCheckbox(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyRadio(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyToggle(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyDivider(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyInput(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyTextarea(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablySelect(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export interface DrawablyBadgeOptions extends DrawablyOptions {
    variant?: "outline" | "scribble";
}
export declare function drawablyBadge(el: HTMLElement, opts?: DrawablyBadgeOptions): Sketch;
export interface DrawablyListOptions extends DrawablyOptions {
    marker?: "dash" | "check";
}
export declare function drawablyList(el: HTMLElement, opts?: DrawablyListOptions): Sketch;
export declare function drawablyUnderline(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyHighlight(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyCircle(el: HTMLElement, opts?: DrawablyOptions): Sketch;
export declare function drawablyArrow(from: HTMLElement, to: HTMLElement, opts?: DrawablyOptions): Sketch;
