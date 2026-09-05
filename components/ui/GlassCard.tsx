"use client";

import { useRef, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "section";
  id?: string;
}

export default function GlassCard({
  children,
  className = "",
  hover = true,
  as: Component = "div",
  id,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), {
    stiffness: 300,
    damping: 30,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hover || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const MotionComponent = motion.create(Component);

  return (
    <MotionComponent
      ref={ref}
      id={id}
      className={`glass ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        hover
          ? {
              rotateX,
              rotateY,
              transformPerspective: 800,
            }
          : undefined
      }
      whileHover={
        hover
          ? {
              y: -4,
              boxShadow:
                "0 12px 48px rgba(22,163,74,0.14), 0 2px 4px rgba(0,0,0,0.06)",
              borderColor: "rgba(22,163,74,0.15)",
              transition: { type: "spring", stiffness: 300, damping: 25 },
            }
          : undefined
      }
    >
      {children}
    </MotionComponent>
  );
}
