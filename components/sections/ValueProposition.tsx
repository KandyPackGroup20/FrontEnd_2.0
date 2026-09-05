"use client";

import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

const features = [
  {
    icon: "/images/icons/icon-rail-road.png",
    title: "Rail + Road Hybrid",
    description:
      "Combine the efficiency of Sri Lanka's rail network with flexible last-mile truck delivery for maximum coverage.",
  },
  {
    icon: "/images/icons/icon-tracking.png",
    title: "Real-Time Tracking",
    description:
      "Follow your shipment every step of the way, from order placement through rail transit to doorstep delivery.",
  },
  {
    icon: "/images/icons/icon-scheduling.png",
    title: "Book 7 Days Ahead",
    description:
      "Plan your logistics in advance. Place orders up to a week ahead and we'll handle the scheduling and routing.",
  },
  {
    icon: "/images/icons/icon-hubs.png",
    title: "6 Regional Hubs",
    description:
      "Covering Colombo, Negombo, Galle, Matara, Jaffna, and Trincomalee, with more cities coming soon.",
  },
];

export default function ValueProposition() {
  return (
    <section
      className="relative py-24 md:py-32 lg:py-40"
      style={{ background: "var(--bg-base)" }}
      id="value-proposition"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <SectionReveal className="mb-16 text-center">
          <RevealItem>
            <span className="caption mb-3 inline-block">Why Kandypack</span>
          </RevealItem>
          <RevealItem>
            <h2 className="mx-auto max-w-2xl">
              The smarter way to move goods across Sri Lanka
            </h2>
          </RevealItem>
          <RevealItem>
            <p className="mx-auto mt-4 max-w-xl text-text-body">
              We combine rail infrastructure with road flexibility to deliver
              FMCG goods faster, cheaper, and more reliably.
            </p>
          </RevealItem>
        </SectionReveal>

        <SectionReveal
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.12}
        >
          {features.map((feature) => (
            <RevealItem key={feature.title}>
              <GlassCard className="flex flex-col p-7 h-full">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                  <Image
                    src={feature.icon}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain"
                  />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-text-body">
                  {feature.description}
                </p>
              </GlassCard>
            </RevealItem>
          ))}
        </SectionReveal>
      </div>
    </section>
  );
}
