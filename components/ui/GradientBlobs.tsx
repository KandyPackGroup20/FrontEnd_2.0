"use client";

import { motion, useReducedMotion } from "motion/react";

interface GradientBlobsProps {
  className?: string;
}

/**
 * Slowly-drifting gradient blobs that sit behind glass panels.
 * Disabled entirely when prefers-reduced-motion is active.
 */
export default function GradientBlobs({ className = "" }: GradientBlobsProps) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    // Static, subtle gradient fallback
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4 rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, var(--green-400) 0%, transparent 70%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Blob 1 — top left, mint */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(circle, var(--mint-glow) 0%, transparent 70%)",
          top: "-10%",
          left: "-5%",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 50, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 — center right, green */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background:
            "radial-gradient(circle, var(--green-400) 0%, transparent 70%)",
          top: "30%",
          right: "-10%",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, -50, 40, 0],
          y: [0, 60, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 — bottom left, mint-green mix */}
      <motion.div
        className="absolute w-[450px] h-[450px] rounded-full opacity-[0.12]"
        style={{
          background:
            "radial-gradient(circle, var(--green-300) 0%, transparent 70%)",
          bottom: "-5%",
          left: "20%",
          filter: "blur(60px)",
        }}
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.05, 0.95, 1],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
