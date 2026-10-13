"use client";

import type { ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/*
 * Motion (motion.dev) for the few interactions CSS can't do well: springs (magnetic CTA) and
 * shared-layout animation (nav pill, explore checklist). Components use the tiny `m.*`
 * elements; the features load lazily after hydration, and `strict` stops anyone importing the
 * full `motion.*` bundle by accident. Reduced-motion users get instant changes.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig
        reducedMotion="user"
        transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
      >
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
