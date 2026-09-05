"use client";

import Image from "next/image";
import { MapPin } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

const cities = [
  { name: "Colombo", region: "Western Province", distance: "115 km" },
  { name: "Negombo", region: "Western Province", distance: "130 km" },
  { name: "Galle", region: "Southern Province", distance: "225 km" },
  { name: "Matara", region: "Southern Province", distance: "260 km" },
  { name: "Jaffna", region: "Northern Province", distance: "390 km" },
  { name: "Trincomalee", region: "Eastern Province", distance: "210 km" },
];

export default function Coverage() {
  return (
    <section
      className="relative py-24 md:py-32 lg:py-40"
      style={{ background: "var(--bg-base)" }}
      id="coverage"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Map Image */}
          <SectionReveal>
            <RevealItem>
              <div className="glass overflow-hidden p-4">
                <Image
                  src="/images/coverage-map.png"
                  alt="Kandypack coverage map showing rail and road routes across Sri Lanka connecting Kandy to six regional hubs"
                  width={600}
                  height={500}
                  className="h-auto w-full rounded-xl"
                  priority={false}
                />
              </div>
            </RevealItem>
          </SectionReveal>

          {/* Right: City Cards */}
          <div>
            <SectionReveal className="mb-8">
              <RevealItem>
                <span className="caption mb-3 inline-block">Coverage</span>
              </RevealItem>
              <RevealItem>
                <h2>Six hubs across Sri Lanka</h2>
              </RevealItem>
              <RevealItem>
                <p className="mt-3 text-text-body">
                  From our central hub in Kandy, we deliver to major
                  destinations island-wide via our rail + road network.
                </p>
              </RevealItem>
            </SectionReveal>

            <SectionReveal
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
              stagger={0.08}
            >
              {cities.map((city) => (
                <RevealItem key={city.name}>
                  <GlassCard className="p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold">{city.name}</h3>
                    <p className="text-xs text-text-muted">{city.region}</p>
                    <p className="mt-1 text-xs font-medium text-green-600">
                      {city.distance}
                    </p>
                  </GlassCard>
                </RevealItem>
              ))}
            </SectionReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
