"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

const steps = [
  {
    icon: "/images/icons/step-1.png",
    title: "Place Order",
    description: "Submit your shipment details at least 7 days in advance.",
  },
  {
    icon: "/images/icons/step-2.png",
    title: "Rail Allocation",
    description:
      "Your cargo is assigned to the optimal train route from Kandy.",
  },
  {
    icon: "/images/icons/step-3.png",
    title: "Station Arrival",
    description: "Goods arrive at the regional hub station nearest to your destination.",
  },
  {
    icon: "/images/icons/step-4.png",
    title: "Last-Mile Truck",
    description: "A local truck picks up your cargo for final delivery.",
  },
  {
    icon: "/images/icons/step-5.png",
    title: "Delivered",
    description:
      "Your shipment reaches its destination, tracked the entire way.",
  },
];

export default function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(lineRef, { once: true, margin: "-100px" });

  return (
    <section
      className="relative py-24 md:py-32 lg:py-40"
      style={{ background: "var(--bg-base-alt)" }}
      id="how-it-works"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <SectionReveal className="mb-16 text-center">
          <RevealItem>
            <span className="caption mb-3 inline-block">How it Works</span>
          </RevealItem>
          <RevealItem>
            <h2 className="mx-auto max-w-2xl">
              From Kandy to your doorstep in five steps
            </h2>
          </RevealItem>
        </SectionReveal>

        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block" ref={lineRef}>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-green-100">
              <motion.div
                className="h-full bg-green-500 origin-left"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
              />
            </div>

            <SectionReveal
              className="relative grid grid-cols-5 gap-4"
              stagger={0.15}
            >
              {steps.map((step, i) => (
                <RevealItem key={step.title}>
                  <div className="flex flex-col items-center text-center">
                    {/* Step icon circle */}
                    <motion.div
                      className="glass relative z-10 mb-6 flex h-[104px] w-[104px] items-center justify-center rounded-full"
                      whileHover={{ scale: 1.08 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Image
                        src={step.icon}
                        alt=""
                        width={48}
                        height={48}
                        className="h-12 w-12 object-contain"
                      />
                    </motion.div>

                    {/* Step number */}
                    <span className="caption mb-2">Step {i + 1}</span>
                    <h3 className="mb-2 text-base font-semibold">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-text-body max-w-[180px]">
                      {step.description}
                    </p>
                  </div>
                </RevealItem>
              ))}
            </SectionReveal>
          </div>
        </div>

        {/* Mobile/Tablet: vertical timeline */}
        <div className="lg:hidden">
          <div className="relative ml-8">
            {/* Vertical connecting line */}
            <div className="absolute top-0 bottom-0 left-[20px] w-[2px] bg-green-100">
              <motion.div
                className="w-full bg-green-500 origin-top"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{ height: "100%" }}
              />
            </div>

            <SectionReveal className="flex flex-col gap-10" stagger={0.12}>
              {steps.map((step, i) => (
                <RevealItem key={step.title}>
                  <div className="flex items-start gap-6">
                    {/* Step icon */}
                    <div className="glass relative z-10 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full">
                      <Image
                        src={step.icon}
                        alt=""
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                      />
                    </div>

                    <div>
                      <span className="caption mb-1 inline-block">
                        Step {i + 1}
                      </span>
                      <h3 className="mb-1 text-base font-semibold">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-body">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
