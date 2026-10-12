import { randomSeed } from "./prng.js";
import { roughCheckmark, roughArrow, roughCircle, roughEllipse, roughLine, roughRoundedRect, scribbleFill, variants, } from "./rough.js";
const SVG_NS = "http://www.w3.org/2000/svg";
const INSET = 3;
function applyTheme(el, opts) {
    if (opts.stroke)
        el.style.setProperty("--drawably-stroke", opts.stroke);
    if (opts.fill)
        el.style.setProperty("--drawably-fill", opts.fill);
    if (opts.paper)
        el.style.setProperty("--drawably-paper", opts.paper);
    if (opts.width !== undefined)
        el.style.setProperty("--drawably-width", String(opts.width));
}
function createSvg() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "drawably-svg");
    svg.setAttribute("aria-hidden", "true");
    return svg;
}
// each layer is drawn once per box; a control has one, an inline decoration
// has one per line it wraps onto
function paint(svg, layers, boxes, o) {
    const w = Math.max(...boxes.map((b) => b.x + b.w));
    const h = Math.max(...boxes.map((b) => b.y + b.h));
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.textContent = "";
    for (const layer of layers) {
        boxes.forEach((box, k) => {
            const ds = variants((lo) => layer.gen(box.w, box.h, lo), { ...o, seed: o.seed + k }, o.boil ? 3 : 1);
            ds.forEach((d, i) => {
                const p = document.createElementNS(SVG_NS, "path");
                p.setAttribute("d", d);
                p.setAttribute("class", ds.length > 1 ? `drawably-boil ${layer.className}` : layer.className);
                p.dataset.i = String(i);
                if (layer.pathLength)
                    p.setAttribute("pathLength", "1");
                if (box.x || box.y)
                    p.setAttribute("transform", `translate(${box.x} ${box.y})`);
                svg.append(p);
            });
        });
    }
}
function elementBox(el) {
    return [{ x: 0, y: 0, w: el.offsetWidth || 120, h: el.offsetHeight || 36 }];
}
// an inline element that wraps is several boxes; its absolutely positioned
// svg lands on the first one's corner, so the svg is offset and sized to
// cover them all and each line gets its own drawing
function lineBoxes(el, svg) {
    const rects = [...el.getClientRects()];
    if (rects.length < 2) {
        svg.style.cssText = "";
        return elementBox(el);
    }
    const [first] = rects;
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    svg.style.cssText = `left:${left - first.left}px;top:${top - first.top}px;width:${right - left}px;height:${bottom - top}px`;
    return rects.map((r) => ({ x: r.left - left, y: r.top - top, w: r.width, h: r.height }));
}
// ResizeObserver ignores inline boxes, so a wrapping decoration watches the
// block that lays it out
function blockAncestor(el) {
    let p = el.parentElement;
    while (p && getComputedStyle(p).display === "inline")
        p = p.parentElement;
    return p;
}
function reducedMotion() {
    return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function attachChrome(el, layers, opts, interactive, inline = false) {
    if (!(el instanceof HTMLElement))
        throw new Error("drawably: expected an HTMLElement");
    el.classList.add("drawably-host");
    applyTheme(el, opts);
    const svg = createSvg();
    el.prepend(svg);
    const roughness = opts.roughness ?? 1;
    const boil = opts.boil ?? 0.3;
    let seed = opts.seed ?? randomSeed();
    const draw = () => paint(svg, layers, inline ? lineBoxes(el, svg) : elementBox(el), { seed, roughness, boil });
    draw();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => draw()) : null;
    ro?.observe(el);
    if (inline) {
        const block = blockAncestor(el);
        if (block)
            ro?.observe(block);
    }
    const resketch = (s) => {
        seed = s ?? randomSeed();
        draw();
    };
    const onPointer = () => resketch();
    if (interactive && !reducedMotion()) {
        el.addEventListener("pointerenter", onPointer);
        el.addEventListener("pointerdown", onPointer);
    }
    return {
        resketch,
        destroy() {
            ro?.disconnect();
            el.removeEventListener("pointerenter", onPointer);
            el.removeEventListener("pointerdown", onPointer);
            svg.remove();
            el.classList.remove("drawably-host");
        },
    };
}
const outlineRect = (r) => (w, h, o) => roughRoundedRect(INSET, INSET, w - 2 * INSET, h - 2 * INSET, r, o);
const focusRect = (r) => (w, h, o) => roughRoundedRect(-1, -1, w + 2, h + 2, r, o);
export function drawablyButton(el, opts = {}) {
    const variant = opts.variant ?? "outline";
    const layers = [];
    if (variant === "solid")
        layers.push({ className: "drawably-blob", gen: outlineRect(8) });
    if (variant === "scribble")
        layers.push({
            className: "drawably-scribble",
            gen: (w, h, o) => scribbleFill(INSET + 2, INSET + 2, w - 2 * INSET - 4, h - 2 * INSET - 4, o),
        });
    layers.push({ className: "drawably-outline", gen: outlineRect(8) });
    layers.push({ className: "drawably-focus", gen: focusRect(10) });
    const sketch = attachChrome(el, layers, opts, true);
    el.classList.add("drawably-button", `drawably-button--${variant}`);
    if (opts.tone)
        el.classList.add(`drawably-button--${opts.tone}`);
    const setState = (state) => {
        if (state === "idle")
            delete el.dataset.state;
        else
            el.dataset.state = state;
    };
    if (opts.state)
        setState(opts.state);
    return {
        resketch: sketch.resketch,
        setState,
        destroy() {
            sketch.destroy();
            delete el.dataset.state;
        },
    };
}
export function drawablyCard(el, opts = {}) {
    const sketch = attachChrome(el, [{ className: "drawably-outline", gen: outlineRect(10) }], opts, false);
    el.classList.add("drawably-card");
    return sketch;
}
function syncedControl(el, type, layers, opts, cls) {
    const input = el?.querySelector?.(`input[type="${type}"]`);
    if (!input)
        throw new Error(`drawably: ${cls} wrapper needs an <input type="${type}">`);
    const sync = () => {
        if (input.checked)
            el.dataset.checked = "";
        else
            delete el.dataset.checked;
    };
    sync();
    // ponytail: a radio unchecks silently when a sibling is picked — one document
    // listener re-reads state on any change instead of tracking the group
    const target = type === "radio" ? document : input;
    target.addEventListener("change", sync);
    const sketch = attachChrome(el, layers, opts, true);
    el.classList.add(cls);
    return {
        resketch: sketch.resketch,
        destroy() {
            target.removeEventListener("change", sync);
            sketch.destroy();
            el.classList.remove(cls);
            delete el.dataset.checked;
        },
    };
}
export function drawablyCheckbox(el, opts = {}) {
    return syncedControl(el, "checkbox", [
        { className: "drawably-outline", gen: outlineRect(5) },
        {
            className: "drawably-check",
            pathLength: true,
            gen: (w, h, o) => roughCheckmark(w * 0.24, h * 0.2, w * 0.52, h * 0.5, o),
        },
        { className: "drawably-focus", gen: focusRect(7) },
    ], opts, "drawably-checkbox");
}
export function drawablyRadio(el, opts = {}) {
    return syncedControl(el, "radio", [
        {
            className: "drawably-outline",
            gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 - INSET, o),
        },
        {
            className: "drawably-dot",
            gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) * 0.18, o),
        },
        {
            className: "drawably-focus",
            gen: (w, h, o) => roughCircle(w / 2, h / 2, Math.min(w, h) / 2 + 1, o),
        },
    ], opts, "drawably-radio");
}
export function drawablyToggle(el, opts = {}) {
    return syncedControl(el, "checkbox", [
        { className: "drawably-outline", gen: (w, h, o) => outlineRect((h - 2 * INSET) / 2)(w, h, o) },
        {
            className: "drawably-blob drawably-knob",
            gen: (_w, h, o) => roughCircle(h / 2, h / 2, h / 2 - INSET - 3, o),
        },
        { className: "drawably-focus", gen: focusRect(12) },
    ], opts, "drawably-toggle");
}
export function drawablyDivider(el, opts = {}) {
    const sketch = attachChrome(el, [{ className: "drawably-outline", gen: (w, h, o) => roughLine(INSET, h / 2, w - INSET, h / 2, o) }], opts, false);
    el.classList.add("drawably-divider");
    return sketch;
}
function fieldBox(el, field, cls, extra, opts) {
    if (!el?.querySelector?.(field))
        throw new Error(`drawably: ${cls} wrapper needs a <${field}>`);
    return decoration(el, cls, [{ className: "drawably-outline", gen: outlineRect(6) }, ...extra, { className: "drawably-focus", gen: focusRect(8) }], opts, false);
}
export function drawablyInput(el, opts = {}) {
    return fieldBox(el, "input", "drawably-inputbox", [], opts);
}
export function drawablyTextarea(el, opts = {}) {
    return fieldBox(el, "textarea", "drawably-textarea", [], opts);
}
// chevron sits in the right-hand gutter the select's CSS padding reserves;
// at this size full roughness turns the V into noise, so it takes a fraction
const CHEVRON_W = 12;
const CHEVRON_H = 6;
const CHEVRON_RIGHT = 12;
const CHEVRON_ROUGHNESS = 0.4;
// ponytail: options are measured once at attach; re-attach if they change
function reserveWidestOption(select) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx)
        return;
    const cs = getComputedStyle(select);
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const widest = Math.max(0, ...[...select.options].map((o) => ctx.measureText(o.text).width));
    const pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    select.style.minWidth = `${Math.ceil(widest + pad)}px`;
}
const PICKER_RADIUS = 6;
// Chromium's base-select renders the select's children inside the picker, so
// a real SVG can sit in there like any other chrome. It has no size until the
// picker opens; the observer draws it at the size it gets. Other engines keep
// the OS popup and ignore the element.
function pickerFrame(select, o) {
    const frame = createSvg();
    frame.classList.add("drawably-picker");
    select.append(frame);
    const draw = () => {
        const w = frame.clientWidth;
        const h = frame.clientHeight;
        if (w && h)
            paint(frame, [{ className: "drawably-outline", gen: outlineRect(PICKER_RADIUS) }], [{ x: 0, y: 0, w, h }], o());
    };
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(draw) : null;
    ro?.observe(frame);
    return {
        draw,
        destroy() {
            ro?.disconnect();
            frame.remove();
        },
    };
}
// the picker's check fills its 0.875em (14px) box bar a 2px inset for the
// stroke and jitter, landing at the checkbox's ~11px check size. A data URI
// can't read custom properties, so it is a mask and the CSS supplies the colour
const CHECK_BOX = 14;
const CHECK_INSET = 2;
function checkMask(o) {
    const side = CHECK_BOX - CHECK_INSET * 2;
    const d = roughCheckmark(CHECK_INSET, CHECK_INSET, side, side, o);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${CHECK_BOX} ${CHECK_BOX}'><path d='${d}' fill='none' stroke='#000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
export function drawablySelect(el, opts = {}) {
    const chevron = {
        className: "drawably-chevron",
        gen: (w, h, o) => {
            const x = w - CHEVRON_RIGHT - CHEVRON_W;
            const y = h / 2 - CHEVRON_H / 2;
            const co = { ...o, roughness: o.roughness * CHEVRON_ROUGHNESS };
            return (roughLine(x, y, x + CHEVRON_W / 2, y + CHEVRON_H, co) +
                roughLine(x + CHEVRON_W / 2, y + CHEVRON_H, x + CHEVRON_W, y, { ...co, seed: o.seed + 1 }));
        },
    };
    let seed = opts.seed ?? randomSeed();
    const sketch = fieldBox(el, "select", "drawably-select", [chevron], { ...opts, seed });
    const select = el.querySelector("select");
    const roughness = opts.roughness ?? 1;
    const boil = opts.boil ?? 0.3;
    reserveWidestOption(select);
    const frame = pickerFrame(select, () => ({ seed, roughness, boil }));
    const mark = () => select.style.setProperty("--drawably-check", checkMask({ seed, roughness }));
    mark();
    return {
        resketch(s) {
            seed = s ?? randomSeed();
            sketch.resketch(seed);
            frame.draw();
            mark();
        },
        destroy() {
            sketch.destroy();
            frame.destroy();
            select.style.removeProperty("min-width");
            select.style.removeProperty("--drawably-check");
        },
    };
}
export function drawablyBadge(el, opts = {}) {
    const variant = opts.variant ?? "outline";
    const layers = [];
    if (variant === "scribble")
        layers.push({
            className: "drawably-scribble",
            gen: (w, h, o) => scribbleFill(INSET + 1, INSET + 1, w - 2 * INSET - 2, h - 2 * INSET - 2, o),
        });
    layers.push({ className: "drawably-outline", gen: outlineRect(2) });
    const sketch = decoration(el, "drawably-badge", layers, opts, false);
    el.classList.add(`drawably-badge--${variant}`);
    return {
        resketch: sketch.resketch,
        destroy() {
            sketch.destroy();
            el.classList.remove(`drawably-badge--${variant}`);
        },
    };
}
// marker geometry in the list's left padding (see .drawably-list); y follows
// the li's line-height so it sits on the first line
const MARKER_LEFT = -18;
const MARKER_W = 10;
const MARKER_LINE = 22;
// ponytail: only the <li> present at attach time are sketched — a
// MutationObserver would cover dynamic lists if anyone needs it
export function drawablyList(el, opts = {}) {
    if (!(el instanceof HTMLElement))
        throw new Error("drawably: expected an HTMLElement");
    const marker = opts.marker ?? "dash";
    const seed = opts.seed ?? randomSeed();
    const items = [...el.querySelectorAll(":scope > li")];
    const sketches = items.map((li, i) => {
        const line = () => parseFloat(getComputedStyle(li).lineHeight) || MARKER_LINE;
        const layer = marker === "check"
            ? {
                className: "drawably-marker",
                gen: (_w, _h, o) => roughCheckmark(MARKER_LEFT, line() / 2 - MARKER_W / 2, MARKER_W, MARKER_W, o),
            }
            : {
                className: "drawably-marker",
                gen: (_w, _h, o) => roughLine(MARKER_LEFT, line() / 2, MARKER_LEFT + MARKER_W, line() / 2, o),
            };
        return attachChrome(li, [layer], { ...opts, seed: seed + i }, false);
    });
    el.classList.add("drawably-list");
    return {
        resketch(s) {
            const base = s ?? randomSeed();
            sketches.forEach((sk, i) => sk.resketch(base + i));
        },
        destroy() {
            for (const sk of sketches)
                sk.destroy();
            el.classList.remove("drawably-list");
        },
    };
}
function decoration(el, cls, layers, opts, interactive) {
    const sketch = attachChrome(el, layers, opts, interactive, true);
    el.classList.add(cls);
    return {
        resketch: sketch.resketch,
        destroy() {
            sketch.destroy();
            el.classList.remove(cls);
        },
    };
}
// underline sits just under the text box; circle overshoots it the way a hand
// loops around a word rather than tracing its edges (tuned on 16–48px Inter)
const UNDERLINE_GAP = 2;
const CIRCLE_PAD_X = 1.15;
const CIRCLE_PAD_Y = 1.4;
const CIRCLE_PAD = 4;
export function drawablyUnderline(el, opts = {}) {
    return decoration(el, "drawably-underline", [{ className: "drawably-outline", gen: (w, h, o) => roughLine(0, h + UNDERLINE_GAP, w, h + UNDERLINE_GAP, o) }], opts, true);
}
export function drawablyHighlight(el, opts = {}) {
    return decoration(el, "drawably-highlight", [{ className: "drawably-wash", gen: (w, h, o) => scribbleFill(0, 0, w, h, o) }], opts, false);
}
export function drawablyCircle(el, opts = {}) {
    return decoration(el, "drawably-circle", [
        {
            className: "drawably-outline",
            gen: (w, h, o) => roughEllipse(w / 2, h / 2, (w / 2) * CIRCLE_PAD_X + CIRCLE_PAD, (h / 2) * CIRCLE_PAD_Y + CIRCLE_PAD, o),
        },
    ], opts, true);
}
// breathing room between an anchor's box edge and the arrow's end
const ARROW_GAP = 6;
// ponytail: the overlay lives on <body> in document coordinates, so anchors
// inside a scrolling container drift on scroll — re-parent to the nearest
// common ancestor if that ever matters
export function drawablyArrow(from, to, opts = {}) {
    if (!(from instanceof HTMLElement) || !(to instanceof HTMLElement))
        throw new Error("drawably: arrow needs two anchor elements");
    const svg = createSvg();
    svg.classList.add("drawably-arrow");
    applyTheme(svg, opts);
    document.body.append(svg);
    const roughness = opts.roughness ?? 1;
    const boil = opts.boil ?? 0.3;
    let seed = opts.seed ?? randomSeed();
    function draw() {
        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();
        const left = Math.min(a.left, b.left);
        const top = Math.min(a.top, b.top);
        const w = Math.max(a.right, b.right) - left;
        const h = Math.max(a.bottom, b.bottom) - top;
        svg.style.left = `${left + scrollX}px`;
        svg.style.top = `${top + scrollY}px`;
        svg.style.width = `${w}px`;
        svg.style.height = `${h}px`;
        const ax = a.left - left + a.width / 2;
        const ay = a.top - top + a.height / 2;
        const bx = b.left - left + b.width / 2;
        const by = b.top - top + b.height / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // distance along the centre line from a box's centre to its edge; `|| 0`
        // turns the 0/0 of a zero-size box into "no inset"
        const exit = (r) => Math.min(r.width / 2 / Math.abs(ux) || 0, r.height / 2 / Math.abs(uy) || 0);
        const t0 = Math.min(exit(a) + ARROW_GAP, len / 2);
        const t1 = Math.min(exit(b) + ARROW_GAP, len / 2);
        const x1 = ax + ux * t0;
        const y1 = ay + uy * t0;
        const x2 = bx - ux * t1;
        const y2 = by - uy * t1;
        paint(svg, [{ className: "drawably-outline", gen: (_w, _h, o) => roughArrow(x1, y1, x2, y2, o) }], [{ x: 0, y: 0, w, h }], { seed, roughness, boil });
    }
    draw();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => draw()) : null;
    ro?.observe(from);
    ro?.observe(to);
    addEventListener("resize", draw);
    return {
        resketch(s) {
            seed = s ?? randomSeed();
            draw();
        },
        destroy() {
            ro?.disconnect();
            removeEventListener("resize", draw);
            svg.remove();
        },
    };
}
