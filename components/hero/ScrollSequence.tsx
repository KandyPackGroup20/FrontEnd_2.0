"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

const TOTAL_FRAMES = 120;
const SEQUENCE_HEIGHT_VH = 500; // wrapper height in vh for scroll duration

/**
 * Apple-style scroll-scrubbed photo sequence hero.
 * Uses GSAP ScrollTrigger + canvas to play through 120 frames on scroll.
 * Degrades to a static fallback on mobile / reduced motion / low memory.
 */
export default function ScrollSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef({ value: 0 });
  const rafRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [taglineOpacity, setTaglineOpacity] = useState(0);

  // Determine if we should run the full sequence
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;
    const lowMemory =
      "deviceMemory" in navigator &&
      (navigator as unknown as { deviceMemory: number }).deviceMemory < 4;

    if (prefersReduced || isMobile || lowMemory) {
      setShouldAnimate(false);
      setLoading(false);
    }
  }, []);

  // Preload all frames
  useEffect(() => {
    if (!shouldAnimate) return;

    let loaded = 0;
    const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

    function onLoad() {
      loaded++;
      setLoadProgress(Math.round((loaded / TOTAL_FRAMES) * 100));
      if (loaded === TOTAL_FRAMES) {
        imagesRef.current = images;
        setLoading(false);
      }
    }

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const num = String(i + 1).padStart(3, "0");
      img.src = `/images/sequence/frame-${num}.jpg`;
      img.onload = onLoad;
      img.onerror = onLoad; // Count errors to avoid hanging
      images[i] = img;
    }
  }, [shouldAnimate]);

  // Draw a frame to the canvas (cover-fit)
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = imagesRef.current[frameIndex];
    if (!canvas || !ctx || !img || !img.complete || !img.naturalWidth) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover-fit: scale to fill, center crop
    const scale = Math.max(cw / iw, ch / ih);
    const sw = cw / scale;
    const sh = ch / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }, []);

  // Initialize GSAP ScrollTrigger
  useEffect(() => {
    if (loading || !shouldAnimate) return;

    let gsapInstance: typeof import("gsap") | null = null;
    let scrollTriggerInstance: typeof import("gsap/ScrollTrigger") | null = null;
    let tween: gsap.core.Tween | null = null;

    async function init() {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      gsapInstance = gsapModule;
      scrollTriggerInstance = { ScrollTrigger } as typeof import("gsap/ScrollTrigger");

      gsapModule.gsap.registerPlugin(ScrollTrigger);

      // Resize canvas to viewport
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      }

      // Draw first frame
      drawFrame(0);

      // Create the scroll-driven tween
      const obj = frameRef.current;
      obj.value = 0;

      tween = gsapModule.gsap.to(obj, {
        value: TOTAL_FRAMES - 1,
        ease: "none",
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          onUpdate: (self) => {
            const frame = Math.round(obj.value);
            // Use rAF for canvas draws
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
              drawFrame(frame);
            });

            // Overlay text opacity based on progress
            const progress = self.progress;
            // Tagline: appears 15%-80%, peaks 25%-70%
            if (progress < 0.15) {
              setTaglineOpacity(0);
            } else if (progress < 0.25) {
              setTaglineOpacity((progress - 0.15) / 0.1);
            } else if (progress < 0.70) {
              setTaglineOpacity(1);
            } else if (progress < 0.80) {
              setTaglineOpacity(1 - (progress - 0.70) / 0.1);
            } else {
              setTaglineOpacity(0);
            }

            // Subtle dark overlay for text readability
            if (progress < 0.10) {
              setOverlayOpacity(0);
            } else if (progress < 0.20) {
              setOverlayOpacity((progress - 0.10) / 0.1 * 0.35);
            } else if (progress < 0.75) {
              setOverlayOpacity(0.35);
            } else {
              setOverlayOpacity(0.35 * (1 - (progress - 0.75) / 0.25));
            }
          },
        },
      });

      // Handle resize
      function onResize() {
        const canvas = canvasRef.current;
        if (canvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = window.innerWidth * dpr;
          canvas.height = window.innerHeight * dpr;
          drawFrame(Math.round(obj.value));
        }
      }

      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const cleanupPromise = init();

    return () => {
      cleanupPromise.then((cleanup) => cleanup?.());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (tween) tween.kill();
    };
  }, [loading, shouldAnimate, drawFrame]);

  // FALLBACK: static hero for mobile / reduced motion
  if (!shouldAnimate) {
    return <HeroFallback />;
  }

  return (
    <section
      ref={wrapperRef}
      className="relative"
      style={{ height: `${SEQUENCE_HEIGHT_VH}vh` }}
      aria-label="Kandypack hero showcase"
    >
      {/* Loading Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
            style={{ background: "var(--bg-base)" }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="text-xl font-bold text-text-heading">
                Kandypack
              </div>
              {/* Glass progress bar */}
              <div className="glass-sm h-2 w-64 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadProgress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-text-muted">
                Loading experience… {loadProgress}%
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Canvas Container */}
      <div
        ref={stickyRef}
        className="sticky top-0 h-screen w-full overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `rgba(0,0,0,${overlayOpacity})`,
          }}
        />

        {/* Overlay Text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none"
          style={{ opacity: taglineOpacity }}
        >
          <h1 className="text-center text-white drop-shadow-lg">
            Ship smarter.
            <br />
            <span className="text-green-300">Rail to road.</span>
          </h1>
          <p className="mt-4 max-w-lg text-center text-lg text-white/80 drop-shadow-md">
            Sri Lanka&apos;s first hybrid logistics network — from Kandy to your
            doorstep via train and truck.
          </p>
        </div>

        {/* Screen-reader accessible heading (hidden visually) */}
        <div className="sr-only">
          <h1>
            Kandypack — Ship smarter with rail to road logistics across Sri Lanka
          </h1>
        </div>
      </div>
    </section>
  );
}

/** Static fallback hero for mobile / reduced motion */
function HeroFallback() {
  return (
    <section
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden"
      aria-label="Kandypack hero"
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/hero-static-fallback.png)",
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <motion.div
        className="relative z-10 flex flex-col items-center px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1 className="text-white">
          Ship smarter.
          <br />
          <span className="text-green-300">Rail to road.</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/80">
          Sri Lanka&apos;s first hybrid logistics network — from Kandy to your
          doorstep via train and truck.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="/register" className="btn-primary">
            Get Started
          </a>
          <a href="#how-it-works" className="btn-secondary !text-white !border-white/30">
            Learn More
          </a>
        </div>
      </motion.div>
    </section>
  );
}
