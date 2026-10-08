"use client";

import { domAnimation, LazyMotion, m, MotionConfig, type Variants } from "motion/react";
import type { ReactNode } from "react";

/** Lazy feature loading + honour the OS "reduce motion" setting. */
function MotionRoot({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

const ease = [0.21, 0.47, 0.32, 0.98] as const;

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

type MotionWrapperProps = { children: ReactNode; className?: string };

/**
 * Fades + slides content in once when it scrolls into view.
 * Don't wrap above-the-fold content (it starts hidden until hydration, which hurts LCP).
 * Uses LazyMotion + `m` so pages without animations never load the motion feature bundle.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: MotionWrapperProps & { delay?: number }) {
  return (
    <MotionRoot>
      <m.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        variants={item}
        transition={{ delay }}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
}

/** Staggers its <StaggerItem> children when the group scrolls into view. */
export function Stagger({
  children,
  className,
  gap = 0.06,
}: MotionWrapperProps & { gap?: number }) {
  return (
    <MotionRoot>
      <m.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
      >
        {children}
      </m.div>
    </MotionRoot>
  );
}

export function StaggerItem({ children, className }: MotionWrapperProps) {
  return (
    <m.div className={className} variants={item}>
      {children}
    </m.div>
  );
}
