import Navbar from "@/components/layout/Navbar";
import ScrollSequence from "@/components/hero/ScrollSequence";
import ValueProposition from "@/components/sections/ValueProposition";
import HowItWorks from "@/components/sections/HowItWorks";
import Coverage from "@/components/sections/Coverage";
import Stats from "@/components/sections/Stats";
import Testimonials from "@/components/sections/Testimonials";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <ScrollSequence />
        <ValueProposition />
        <HowItWorks />
        <Coverage />
        <Stats />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
