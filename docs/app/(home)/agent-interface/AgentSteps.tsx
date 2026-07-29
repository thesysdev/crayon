"use client";

import { useEffect, useRef, useState } from "react";
import {
  StepsAccordion,
  type StepsAccordionItem,
} from "../components/StepsAccordion/StepsAccordion";
function createVideoIllustration(src: string) {
  return function VideoIllustration() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
    const [isInViewport, setIsInViewport] = useState(false);
    const [isPageVisible, setIsPageVisible] = useState(false);
    const [canAutoPlay, setCanAutoPlay] = useState(false);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          const isVisible = entry?.isIntersecting ?? false;
          setIsInViewport(isVisible);
          if (isVisible) setHasEnteredViewport(true);
        },
        { threshold: 0.25 },
      );

      observer.observe(video);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      const updatePageVisibility = () => setIsPageVisible(!document.hidden);
      updatePageVisibility();
      document.addEventListener("visibilitychange", updatePageVisibility);
      return () => document.removeEventListener("visibilitychange", updatePageVisibility);
    }, []);

    useEffect(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const updateMotionPreference = () => setCanAutoPlay(!reducedMotion.matches);
      updateMotionPreference();
      reducedMotion.addEventListener("change", updateMotionPreference);
      return () => reducedMotion.removeEventListener("change", updateMotionPreference);
    }, []);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || !hasEnteredViewport) return;

      if (isInViewport && isPageVisible && canAutoPlay) {
        void video.play().catch(() => {
          // Autoplay can still be blocked by browser policy; the visual remains
          // on its first frame without retrying or fetching another source.
        });
      } else {
        video.pause();
      }
    }, [canAutoPlay, hasEnteredViewport, isInViewport, isPageVisible]);

    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (!video) return;
      const parent = video.parentElement;
      if (!parent) return;
      const ratio = video.videoWidth / video.videoHeight;
      if (Number.isFinite(ratio) && ratio > 0) {
        parent.style.aspectRatio = String(ratio);
        parent.style.height = "auto";
        // On mobile the scale wrapper sits inside a fixed-aspect frame; match the
        // frame to the video's ratio so it hugs the video with no empty space.
        if (parent.className.includes("mobileIllustrationScale")) {
          const frame = parent.parentElement;
          if (frame) frame.style.aspectRatio = String(ratio);
        }
      }
    };

    return (
      <video
        ref={videoRef}
        src={hasEnteredViewport ? src : undefined}
        muted
        loop
        playsInline
        preload="none"
        onLoadedMetadata={handleLoadedMetadata}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "inherit",
          display: "block",
        }}
      />
    );
  };
}

const AGENT_STEPS: StepsAccordionItem[] = [
  {
    number: 1,
    title: "Analytics",
    description:
      "Help users move from raw data to dashboards, insights, and decision-ready reports.",
    details: [],
    Illustration: createVideoIllustration("/agent-interface/hostpog.mp4"),
  },
  {
    number: 2,
    title: "CRM / Sales",
    description: "Help teams turn account context into QBRs, follow-ups, and revenue actions.",
    details: [],
    Illustration: createVideoIllustration("/agent-interface/Play.mp4"),
  },
  {
    number: 3,
    title: "Customer support",
    description:
      "Help support teams resolve issues faster with guided answers, actions, and workflows.",
    details: [],
    Illustration: createVideoIllustration("/agent-interface/tendesk.mp4"),
  },
  {
    number: 4,
    title: "DevTools",
    description: "Help developers move from logs and errors to explanations, fixes, and workflows.",
    details: [],
    Illustration: createVideoIllustration("/agent-interface/Fixpanel.mp4"),
  },
  {
    number: 5,
    title: "Project management",
    description: "Help teams turn scattered work into plans, summaries, blockers, and next steps.",
    details: [],
    Illustration: createVideoIllustration("/agent-interface/Linea.mp4"),
  },
];

export function AgentSteps({
  autoAdvance = false,
  variant,
}: { autoAdvance?: boolean; variant?: "useCases" } = {}) {
  return <StepsAccordion steps={AGENT_STEPS} autoAdvance={autoAdvance} variant={variant} />;
}
