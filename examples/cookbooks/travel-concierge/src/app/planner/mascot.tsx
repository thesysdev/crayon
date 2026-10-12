"use client";

import { type MouseEvent, useRef, useState } from "react";
import "./mascot.css";

// The planner's mascot: a face under a coral bucket hat (public/mascot.svg, as drawn). It sits in
// the top-left corner, in the column of the floating + / history pill and on the row of the
// Explore / Itinerary control, where the two meet. On hover it tilts to one side or the other;
// a click makes it do a trick.

/** On hover, a tilt of 6 to 12 degrees to a random side; level again when the pointer leaves. */
function useTilt() {
  const [angle, setAngle] = useState(0);
  const enter = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAngle((Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 6));
  };
  return { angle, enter, leave: () => setAngle(0) };
}

// Tricks on click: a cartwheel (a full roll out along a little hop and back to the corner) or a
// swirl (a double twirl with a squash-and-stretch bounce). Transforms only, so nothing moves.
const tricks: Record<string, { frames: Keyframe[]; duration: number }> = {
  cartwheel: {
    frames: [
      { transform: "translate(0, 0) rotate(0deg)" },
      { transform: "translate(22px, -26px) rotate(150deg)", offset: 0.35 },
      { transform: "translate(34px, -6px) rotate(280deg)", offset: 0.6 },
      { transform: "translate(0, 0) rotate(360deg)" },
    ],
    duration: 900,
  },
  swirl: {
    frames: [
      { transform: "rotate(0deg) scale(1, 1)" },
      { transform: "rotate(200deg) scale(1.15, 0.85)", offset: 0.3 },
      { transform: "rotate(520deg) scale(0.9, 1.12)", offset: 0.65 },
      { transform: "rotate(720deg) scale(1, 1)" },
    ],
    duration: 1000,
  },
};
const wiggle: Keyframe[] = [{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }];

/** Plays a random trick on each click; clicks during a trick chain the next one after it. */
function useTricks() {
  const queue = useRef(0);
  const playing = useRef(false);
  const play = (el: HTMLElement) => {
    playing.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trick = tricks[Math.random() < 0.5 ? "cartwheel" : "swirl"];
    const run = el.animate(reduce ? wiggle : trick.frames, {
      duration: reduce ? 300 : trick.duration,
      easing: "cubic-bezier(0.34, 1.3, 0.5, 1)",
    });
    run.onfinish = () => {
      if (queue.current > 0) {
        queue.current -= 1;
        play(el);
      } else playing.current = false;
    };
  };
  return (e: MouseEvent<HTMLElement>) => {
    if (playing.current) queue.current = Math.min(queue.current + 1, 2);
    else play(e.currentTarget);
  };
}

export function Mascot({ size = 56, className }: { size?: number; className?: string }) {
  const { angle, enter, leave } = useTilt();
  const trick = useTricks();
  return (
    <span
      className={`pl-mascot${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size, rotate: `${angle}deg` }}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onClick={trick}
      aria-hidden
    >
      {/* The drawing fills the middle of its 2048 box; the frame crops to it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mascot.svg" alt="" draggable={false} />
    </span>
  );
}
