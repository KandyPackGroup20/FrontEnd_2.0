"use client";

import { type ReactNode } from "react";
import { motion } from "motion/react";

interface SectionRevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay between children (seconds) */
  stagger?: number;
  /** Direction of slide */
  direction?: "up" | "down" | "left" | "right";
  id?: string;
}

const directionOffsets = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
};

export default function SectionReveal({
  children,
  className = "",
  stagger = 0.1,
  direction = "up",
  id,
}: SectionRevealProps) {
  const offset = directionOffsets[direction];

  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Wrap each child element that should stagger-reveal */
export function RevealItem({
  children,
  className = "",
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
}) {
  const offset = directionOffsets[direction];

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, ...offset },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
