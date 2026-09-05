"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

const testimonials = [
  {
    name: "Ashan Perera",
    role: "Supply Chain Manager, Lanka Foods",
    quote:
      "Kandypack transformed how we distribute products from Kandy. The rail+road hybrid cuts our transit time by 40% compared to road-only freight.",
  },
  {
    name: "Dilini Fernando",
    role: "Operations Head, Ceylon Naturals",
    quote:
      "Real-time tracking means I always know where our FMCG shipments are. The 7-day advance booking lets us plan production around delivery schedules.",
  },
  {
    name: "Ruwan Jayawardena",
    role: "Logistics Director, Hill Country Exports",
    quote:
      "We ship to all six hubs weekly. Kandypack's combination of rail efficiency and last-mile truck delivery is exactly what Sri Lankan logistics needed.",
  },
  {
    name: "Nimesha Silva",
    role: "Founder, Fresh Island Co.",
    quote:
      "As a small business, reliable logistics was our biggest challenge. Kandypack made it simple — book online, track in real time, delivered on schedule.",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent(
      (c) => (c - 1 + testimonials.length) % testimonials.length
    );
  }, []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <section
      className="relative py-24 md:py-32 lg:py-40"
      style={{ background: "var(--bg-base)" }}
      id="testimonials"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <SectionReveal className="mb-12 text-center">
          <RevealItem>
            <span className="caption mb-3 inline-block">Testimonials</span>
          </RevealItem>
          <RevealItem>
            <h2>Trusted by businesses across Sri Lanka</h2>
          </RevealItem>
        </SectionReveal>

        <div className="relative mx-auto max-w-2xl">
          {/* Carousel */}
          <div className="relative overflow-hidden" style={{ minHeight: 240 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.3 },
                }}
                className="absolute inset-0"
              >
                <GlassCard
                  className="flex flex-col items-center p-8 text-center md:p-10"
                  hover={false}
                >
                  <Quote className="mb-4 h-8 w-8 text-green-300" />
                  <p className="mb-6 text-lg leading-relaxed text-text-body italic">
                    &ldquo;{testimonials[current].quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-text-heading">
                      {testimonials[current].name}
                    </p>
                    <p className="text-sm text-text-muted">
                      {testimonials[current].role}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="glass-sm flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105"
              aria-label="Previous testimonial"
              id="testimonial-prev"
            >
              <ChevronLeft className="h-5 w-5 text-text-heading" />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 bg-green-600"
                      : "w-2 bg-green-200 hover:bg-green-300"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="glass-sm flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-105"
              aria-label="Next testimonial"
              id="testimonial-next"
            >
              <ChevronRight className="h-5 w-5 text-text-heading" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
