"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Native horizontal scroll with snap points (swipe/trackpad/keyboard work out of the box);
 * the buttons just scroll by one card. No carousel library.
 *
 * No CSS `scroll-smooth` and a matching `scroll-px-4`: otherwise the browser smooth-scrolls on
 * load to satisfy the snap, and Chrome stops measuring LCP for the whole page.
 */
export function TestimonialsCarousel({ children, count }: { children: ReactNode; count: number }) {
  const ref = useRef<HTMLUListElement>(null);
  const scroll = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector("li");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({
      left: direction * ((card?.clientWidth ?? 320) + 20),
      behavior: reduced ? "auto" : "smooth",
    });
  };
  return (
    <div className="flex flex-col gap-4">
      <ul
        ref={ref}
        tabIndex={0}
        aria-label="Testimonials"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 [scrollbar-width:thin] gap-5 overflow-x-auto px-4 pb-2 focus-visible:outline-offset-4"
      >
        {children}
      </ul>
      {count > 1 ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous testimonial"
            onClick={() => scroll(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next testimonial"
            onClick={() => scroll(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
