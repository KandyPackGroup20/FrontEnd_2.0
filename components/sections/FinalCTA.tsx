"use client";

import { ArrowRight, Search } from "lucide-react";
import Button from "@/components/ui/Button";
import SectionReveal, { RevealItem } from "@/components/ui/SectionReveal";
import GradientBlobs from "@/components/ui/GradientBlobs";

export default function FinalCTA() {
  return (
    <section
      className="relative py-24 md:py-32"
      style={{ background: "var(--bg-base-alt)" }}
      id="final-cta"
    >
      <GradientBlobs />

      <div className="relative mx-auto max-w-[1280px] px-6 md:px-16">
        <SectionReveal>
          <RevealItem>
            <div
              className="glass overflow-hidden rounded-3xl p-10 text-center md:p-16"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(110,231,180,0.15) 50%, rgba(255,255,255,0.55) 100%)",
              }}
            >
              <h2 className="mx-auto max-w-xl">
                Ready to ship smarter?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-text-body">
                Join hundreds of businesses already using Kandypack&apos;s rail +
                road network to distribute across Sri Lanka.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  variant="primary"
                  size="lg"
                  href="/register"
                  id="cta-create-account"
                >
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  href="/orders"
                  id="cta-track-shipment"
                >
                  <Search className="h-4 w-4" />
                  Track a shipment
                </Button>
              </div>
            </div>
          </RevealItem>
        </SectionReveal>
      </div>
    </section>
  );
}
