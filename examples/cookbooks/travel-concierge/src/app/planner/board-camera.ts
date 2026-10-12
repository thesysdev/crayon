// Pan and zoom for the Itinerary board, after the Tales canvas (camera2DController and
// wheelIntent in tales-ui). The camera owns the world's transform and writes it straight to the
// DOM, never through React: at most one requestAnimationFrame is scheduled at a time, and every
// change made before it lands is drawn in that one frame. Zoom (and a wheel pan) eases from where
// the view is towards where it's headed with a decay normalised to the frame's delta time, so it
// feels the same at 60Hz and 120Hz. The wheel's intent, pan or zoom, is held for a whole gesture.

export type View = { x: number; y: number; z: number };
export type Bounds = { x: number; y: number; w: number; h: number };

/** The frame the decay is tuned for: 120fps. */
const FRAME = 1000 / 120;
const DECAY = 0.35;

const WHEEL_PAN = 2;
const WHEEL_ZOOM_BASE = 1.04;
const WHEEL_ZOOM = 1.1;
const PINCH_ZOOM = 4;
const MAX_ZOOM_EXPONENT = 4.4;
const GESTURE_PAUSE = 80;
const HISTORY = 4;
const ACCELERATION_BASELINE = 8;
const ACCELERATION_SPIKE = 3;

type Wheel = { intent: "pan" | "zoom" | null; pinch: boolean; at: number; dx: number; dy: number; history: number[] };

export class Camera {
  min = 0.1;
  max = 2;
  private current: View = { x: 0, y: 0, z: 1 };
  private target: View = { x: 0, y: 0, z: 1 };
  private decay = DECAY;
  private easing = false;
  private frame = 0;
  private last = 0;
  private wheel: Wheel = { intent: null, pinch: false, at: -Infinity, dx: 0, dy: 0, history: [] };
  /** Whether Control is really held: a trackpad pinch arrives as a wheel with ctrlKey and no key. */
  private control = false;

  constructor(
    private viewport: HTMLElement,
    private world: HTMLElement,
  ) {
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKey);
    window.addEventListener("blur", this.onBlur);
    viewport.addEventListener("wheel", this.onWheel, { passive: false });
    this.schedule();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKey);
    window.removeEventListener("blur", this.onBlur);
    this.viewport.removeEventListener("wheel", this.onWheel);
  }

  get view(): View {
    return { ...this.current };
  }

  /** A point on screen (client coordinates) as a point on the board. */
  toWorld(clientX: number, clientY: number) {
    const rect = this.viewport.getBoundingClientRect();
    return { x: (clientX - rect.left - this.current.x) / this.current.z, y: (clientY - rect.top - this.current.y) / this.current.z };
  }

  /** Stops any easing where it is, so a hand on the board takes over from it. */
  hold() {
    this.target = { ...this.current };
    this.easing = false;
  }

  /** Moves by a screen distance at once (a drag pans 1:1, under the finger). */
  panBy(dx: number, dy: number) {
    if (!dx && !dy) return;
    this.current = { ...this.current, x: this.current.x + dx, y: this.current.y + dy };
    this.target = { ...this.target, x: this.target.x + dx, y: this.target.y + dy };
    this.schedule();
  }

  /** Zooms by a factor about a screen point at once (a two-finger pinch on a touch screen). */
  zoomBy(factor: number, clientX: number, clientY: number) {
    const rect = this.viewport.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const z = this.clamp(this.current.z * factor);
    const view = { z, x: px - ((px - this.current.x) / this.current.z) * z, y: py - ((py - this.current.y) / this.current.z) * z };
    this.current = view;
    this.target = { ...view };
    this.easing = false;
    this.schedule();
  }

  /** Eases towards a view; a smaller decay is a slower, softer move. */
  easeTo(view: View, decay = DECAY) {
    this.target = { ...view, z: this.clamp(view.z) };
    this.decay = decay;
    this.easing = true;
    this.schedule();
  }

  /** Frames a part of the board in the viewport, centred, never closer than `max`. */
  fit(bounds: Bounds, { inset = 56, max = 1, decay }: { inset?: number; max?: number; decay?: number } = {}) {
    const { width, height } = this.viewport.getBoundingClientRect();
    if (!(width > inset * 2 && height > inset * 2 && bounds.w > 0 && bounds.h > 0)) return;
    const z = this.clamp(Math.min((width - inset * 2) / bounds.w, (height - inset * 2) / bounds.h, max));
    const view = { z, x: width / 2 - (bounds.x + bounds.w / 2) * z, y: height / 2 - (bounds.y + bounds.h / 2) * z };
    if (decay === undefined) {
      this.current = view;
      this.target = { ...view };
      this.easing = false;
      this.schedule();
    } else this.easeTo(view, decay);
  }

  private clamp(z: number) {
    return Math.min(this.max, Math.max(this.min, z));
  }

  private schedule() {
    if (!this.frame) this.frame = requestAnimationFrame(this.tick);
  }

  private tick = (time: number) => {
    this.frame = 0;
    const dt = this.last ? Math.min(time - this.last, 64) : FRAME;
    this.last = time;
    if (this.easing) {
      const f = this.decay >= 1 ? 1 : 1 - (1 - this.decay) ** (dt / FRAME);
      const { current: c, target: t } = this;
      this.current = { x: c.x + (t.x - c.x) * f, y: c.y + (t.y - c.y) * f, z: c.z + (t.z - c.z) * f };
      // Scale and pan are one anchored transform, so they settle together.
      const settled = Math.abs(t.z - this.current.z) < 0.0001 && Math.abs(t.x - this.current.x) < 0.01 && Math.abs(t.y - this.current.y) < 0.01;
      if (settled) {
        this.current = { ...t };
        this.easing = false;
      }
    }
    this.write();
    if (this.easing) this.schedule();
    else this.last = 0;
  };

  private write() {
    const { x, y, z } = this.current;
    this.world.style.transform = `matrix(${z}, 0, 0, ${z}, ${x}, ${y})`;
    // A cached raster while zoomed out and moving; released at rest so text redraws sharp.
    this.world.style.willChange = this.easing && z < 1 ? "transform" : "";
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Control") this.control = e.type === "keydown";
  };

  private onBlur = () => {
    this.control = false;
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    // Lines (a mouse wheel in Firefox) to pixels.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.viewport.clientHeight : 1;
    const dx = e.deltaX * unit;
    const dy = e.deltaY * unit;
    const intent = this.intent(dx, dy, e.timeStamp, e.ctrlKey, e.metaKey);
    if (intent === "pan") {
      this.easeTo({ ...this.target, x: this.target.x - (WHEEL_PAN / 2) * dx, y: this.target.y - (WHEEL_PAN / 2) * dy });
      return;
    }
    const exponent = Math.max(-MAX_ZOOM_EXPONENT, Math.min(MAX_ZOOM_EXPONENT, (-dy * (this.wheel.pinch ? PINCH_ZOOM : WHEEL_ZOOM)) / 10));
    if (!dy) return;
    // Anchored on the pointer: the board point under it stays under it as the zoom eases in.
    const rect = this.viewport.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const t = this.target;
    const z = this.clamp(t.z * WHEEL_ZOOM_BASE ** exponent);
    this.easeTo({ z, x: px - ((px - t.x) / t.z) * z, y: py - ((py - t.y) / t.z) * z });
  };

  /** Pan or zoom, decided when a gesture starts (a pause, a turn, a sudden speed-up) and kept
   *  for the rest of it, so letting go of ⌘ mid-scroll doesn't start panning. */
  private intent(dx: number, dy: number, at: number, ctrl: boolean, meta: boolean) {
    const w = this.wheel;
    const magnitude = Math.hypot(dx, dy);
    const since = at - w.at;
    const paused = !Number.isFinite(since) || since < 0 || since > GESTURE_PAUSE;
    const turnedX = dx !== 0 && Math.sign(dx) !== w.dx;
    const turnedY = dy !== 0 && Math.sign(dy) !== w.dy;
    const average = w.history.length ? w.history.reduce((sum, m) => sum + m, 0) / w.history.length : magnitude;
    const accelerated = average < ACCELERATION_BASELINE && magnitude - ACCELERATION_SPIKE >= average;
    const fresh = paused || turnedX || turnedY || accelerated || w.intent === null;
    const history = paused ? [] : w.history.slice(-(HISTORY - 1));
    history.push(magnitude);
    const pinch = ctrl && !this.control;
    const intent = pinch ? "zoom" : fresh ? (ctrl || meta ? "zoom" : "pan") : w.intent!;
    this.wheel = {
      intent,
      pinch: pinch || (fresh ? false : w.pinch),
      at,
      dx: dx ? Math.sign(dx) : w.dx,
      dy: dy ? Math.sign(dy) : w.dy,
      history,
    };
    return intent;
  }
}
