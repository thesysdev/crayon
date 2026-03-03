'use client';

import { motion } from "motion/react";
import { useRef, useState, useEffect, lazy, Suspense } from "react";
import svgHeroPaths from "@/imports/svg-a5kdrdeeao";
import svgMascotPaths from "@/imports/svg-148i9mcxjn";
import HeroPreviewFrame from "@/imports/Frame2147239423";
import { BUTTON_SHADOW, CopyIcon } from "./shared";

const LazyMobileActionFigure = lazy(
  () => import("@/imports/MobileActionFigure")
);

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

const EASE = [0.25, 0.1, 0.25, 1] as const;

/** Desktop: slower, more dramatic stagger */
const DESKTOP = { duration: 0.7, lines: 0, title: 0.5, subtitle: 1.0, cta: 1.5, image: 2.0 } as const;

/** Mobile: snappier with tighter stagger */
const MOBILE = { duration: 0.5, mascot: 0, title: 0.25, subtitle: 0.5, cta: 0.75 } as const;

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: DESKTOP.duration, delay, ease: EASE },
});

const fadeIn = (delay: number) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: DESKTOP.duration, delay, ease: EASE },
});

const mobileFadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: MOBILE.duration, delay, ease: EASE },
  style: { willChange: "auto" } as const,
});


// CTAs
const primaryCTA = "npm install @openuidev/lang-react @openuidev/react-ui";
const secondaryCTA = "Playground";
// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

function PrimaryButton({ className = "" }: { className?: string }) {
  return (
    <button
      className={`bg-black flex gap-2.5 h-12 items-center justify-center px-5 rounded-full shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-black/85 active:bg-black/75 ${className}`}
      onClick={() => {
        navigator.clipboard.writeText(primaryCTA);
      }}
    >
      <CopyIcon />
      <span className="font-['Inter_Display',sans-serif] font-medium text-[18px] leading-6 text-white whitespace-nowrap">
        {primaryCTA}
      </span>
    </button>
  );
}

function SecondaryButton({ className = "" }: { className?: string }) {
  return (
    <a href="/playground">
      <button
        className={`bg-white flex gap-2.5 h-12 items-center justify-center px-4 rounded-full shrink-0 cursor-pointer relative transition-all duration-200 hover:scale-105 ${className}`}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-full border-[1.25px] border-black/8"
          style={{ boxShadow: BUTTON_SHADOW }}
        />
        <span className="font-['Inter_Display',sans-serif] font-medium text-[18px] leading-6 text-black relative whitespace-nowrap">
          {secondaryCTA}
        </span>
      </button>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Mascot SVG (mobile hero)
// ---------------------------------------------------------------------------

const MASCOT_STROKED_PATHS = [
  svgMascotPaths.p75ec1f0,
  svgMascotPaths.p3d8f4800,
  svgMascotPaths.p186ed000,
  svgMascotPaths.p5c95b80,
  svgMascotPaths.p2d8cb380,
] as const;

const MASCOT_FILLED_PATHS = [
  svgMascotPaths.p6bfe080,
  svgMascotPaths.pe416040,
  svgMascotPaths.p34c31400,
] as const;

function MascotSvg() {
  return (
    <svg
      className="absolute block"
      fill="none"
      viewBox="0 0 107.917 87.2814"
      style={{ inset: "9.29% 0 10% 0", width: "100%", height: "80.71%" }}
    >
      {MASCOT_STROKED_PATHS.map((d) => (
        <path key={d.slice(0, 20)} d={d} fill="black" stroke="black" strokeWidth="0.458571" />
      ))}
      {MASCOT_FILLED_PATHS.map((d) => (
        <path key={d.slice(0, 20)} d={d} fill="black" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Desktop hero
// ---------------------------------------------------------------------------

function DesktopHero() {
  return (
    <div className="hidden lg:block relative w-full overflow-hidden pt-22 pb-17 px-8">
      <div className="max-w-300 mx-auto relative">
        {/* Invisible spacer for aspect ratio */}
        <svg
          className="w-full h-auto block invisible"
          fill="none"
          viewBox="0 0 1600 376"
          aria-hidden="true"
        >
          <rect width="1600" height="376" />
        </svg>

        {/* Grid lines */}
        <motion.div className="absolute inset-0 will-change-[opacity]" {...fadeIn(DESKTOP.lines)}>
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 1600 376"
            preserveAspectRatio="none"
          >
            <defs>
              {[189, 787].map((x) => (
                <linearGradient
                  key={x}
                  id={`heroVFade${x}`}
                  x1={x}
                  x2={x}
                  y1="0"
                  y2="376"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="black" stopOpacity="0" />
                  <stop offset="0.15" stopColor="black" stopOpacity="1" />
                  <stop offset="0.85" stopColor="black" stopOpacity="1" />
                  <stop offset="1" stopColor="black" stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>
            <path d="M0 112H1600" stroke="black" strokeOpacity="0.1" />
            <path d="M0 243H1600" stroke="black" strokeOpacity="0.1" />
            <path d="M189 0V376" stroke="url(#heroVFade189)" strokeOpacity="0.1" />
            <path d="M787 0V376" stroke="url(#heroVFade787)" strokeOpacity="0.1" />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.div
          className="absolute inset-0 will-change-[transform,opacity]"
          {...fadeUp(DESKTOP.title)}
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 1600 376">
            <path d={svgHeroPaths.pb12f700} fill="black" />
          </svg>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          className="absolute inset-0 will-change-[transform,opacity]"
          {...fadeUp(DESKTOP.subtitle)}
        >
          <svg className="w-full h-full" fill="none" viewBox="0 0 1600 376">
            <path d={svgHeroPaths.p38a6ed80} fill="black" fillOpacity="0.4" />
          </svg>
        </motion.div>

        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-[40px] pointer-events-none bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[40px] pointer-events-none bg-gradient-to-l from-white to-transparent" />

        {/* CTA buttons */}
        <motion.div
          className="absolute flex gap-1.5 will-change-[transform,opacity]"
          style={{ left: "51.125%", top: "71.19%" }}
          {...fadeUp(DESKTOP.cta)}
        >
          <PrimaryButton />
          <SecondaryButton />
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile hero
// ---------------------------------------------------------------------------

function MobileHero() {
  return (
    <div className="lg:hidden relative overflow-hidden">
      <div className="relative px-5 pt-[60px] pb-5">
        <div className="flex flex-col items-center gap-5 w-full max-w-[345px] mx-auto py-10">
          {/* Mascot — fades in with a slight tilt */}
          <motion.div
            className="relative shrink-0 size-[140px]"
            initial={{ opacity: 0, rotate: -12 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ duration: MOBILE.duration, delay: MOBILE.mascot, ease: EASE }}
            style={{ willChange: "auto" }}
          >
            <MascotSvg />
          </motion.div>

          {/* Title */}
          <motion.p
            className="font-['Inter_Display',sans-serif] text-[80px] leading-[1.25] text-black text-center"
            {...mobileFadeUp(MOBILE.title)}
            style={{ ...mobileFadeUp(MOBILE.title).style, fontWeight: 600 }}
          >
            OpenUI
          </motion.p>

          {/* Subtitle */}
          <motion.p
            className="font-['Inter_Display',sans-serif] text-[22px] leading-[1.2] text-black/40 text-center"
            {...mobileFadeUp(MOBILE.subtitle)}
            style={{ ...mobileFadeUp(MOBILE.subtitle).style, fontWeight: 500 }}
          >
            The Open Standard
            <br />
            for Generative UI
          </motion.p>
        </div>
      </div>

      {/* CTA buttons */}
      <motion.div
        className="relative flex flex-col items-center gap-3 px-10 pt-5 pb-20"
        {...mobileFadeUp(MOBILE.cta)}
      >
        <SecondaryButton className="w-full max-w-[280px]" />
        <PrimaryButton className="w-full max-w-[280px]" />
      </motion.div>

      {/* Full-width hero illustration */}
      <div className="w-screen relative left-1/2 -translate-x-1/2">
        <Suspense fallback={<div className="aspect-video" />}>
          <LazyMobileActionFigure />
        </Suspense>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop preview frame (ResizeObserver-scaled)
// ---------------------------------------------------------------------------

const PREVIEW_NATIVE_WIDTH = 1600;
const PREVIEW_NATIVE_HEIGHT = 518;
const PREVIEW_SCALE_MULTIPLIER = 1.25;

function ScaledPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / PREVIEW_NATIVE_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <div
        style={{
          width: PREVIEW_NATIVE_WIDTH,
          height: PREVIEW_NATIVE_HEIGHT,
          transformOrigin: "top center",
          position: "absolute",
          left: "50%",
          transform: `translateX(-50%) scale(${scale * PREVIEW_SCALE_MULTIPLIER})`,
        }}
      >
        <HeroPreviewFrame />
      </div>
    </div>
  );
}

function PreviewImage() {
  return (
    <motion.div className="mt-8 lg:mt-10 w-full overflow-hidden" {...fadeIn(DESKTOP.image)}>
      <div className="hidden lg:flex justify-center overflow-hidden">
        <div
          className="relative overflow-hidden"
          style={{
            width: "calc(100% + 240px)",
            maxWidth: "100vw",
            aspectRatio: `${PREVIEW_NATIVE_WIDTH} / ${PREVIEW_NATIVE_HEIGHT}`,
            marginInline: "-120px",
          }}
        >
          <ScaledPreview />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Tagline
// ---------------------------------------------------------------------------

function Tagline() {
  return (
    <div className="px-5 lg:px-8 mt-5 lg:mt-10 lg:py-10">
      <div className="max-w-[1200px] mx-auto">
        <p className="font-['Inter_Display',sans-serif] font-medium text-[22px] lg:text-[28px] text-black/40 leading-[1.4] text-center">
          An open source toolkit to make your{" "}
          <br className="hidden lg:inline" />
          AI apps respond with your UI.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function HeroSection() {
  return (
    <section className="w-full">
      <DesktopHero />
      <MobileHero />
      <PreviewImage />
      <Tagline />
    </section>
  );
}
