"use client";

import { Train, Radio, Clock } from "lucide-react";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

const stats = [
  {
    icon: Train,
    value: 6,
    suffix: "",
    label: "Regional Hubs",
    description: "Across Sri Lanka",
  },
  {
    icon: Radio,
    value: 100,
    suffix: "+",
    label: "Concurrent Orders",
    description: "Supported daily",
  },
  {
    icon: Clock,
    value: 24,
    suffix: "/7",
    label: "Real-Time Tracking",
    description: "Always connected",
  },
];

export default function Stats() {
  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--bg-base-alt)" }}
      id="stats"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <SectionReveal
          className="glass mx-auto grid max-w-4xl gap-8 p-8 sm:grid-cols-3 md:p-12"
          stagger={0.15}
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <RevealItem key={stat.label}>
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                    <Icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-4xl font-bold text-text-heading md:text-5xl">
                    <AnimatedCounter
                      target={stat.value}
                      suffix={stat.suffix}
                      duration={2}
                    />
                  </div>
                  <h3 className="mt-2 text-base font-semibold">{stat.label}</h3>
                  <p className="text-sm text-text-muted">{stat.description}</p>
                </div>
              </RevealItem>
            );
          })}
        </SectionReveal>
      </div>
    </section>
  );
}
