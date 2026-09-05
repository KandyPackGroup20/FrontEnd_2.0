import type { Metadata } from "next";
import { Geist } from "next/font/google";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kandypack.lk"),
  title: {
    default: "Kandypack — Rail & Road Logistics for Sri Lanka",
    template: "%s | Kandypack",
  },
  description:
    "Ship FMCG goods from Kandy to six regional hubs across Sri Lanka via train and truck. Real-time tracking, 7-day advance booking, and last-mile delivery.",
  keywords: [
    "logistics",
    "Sri Lanka",
    "rail freight",
    "FMCG distribution",
    "supply chain",
    "Kandy",
    "Colombo",
    "delivery tracking",
  ],
  openGraph: {
    title: "Kandypack — Rail & Road Logistics for Sri Lanka",
    description:
      "Sri Lanka's first hybrid logistics network — rail efficiency meets last-mile truck delivery.",
    url: "https://kandypack.lk",
    siteName: "Kandypack",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Kandypack — Ship smarter with rail to road logistics",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kandypack — Rail & Road Logistics for Sri Lanka",
    description:
      "Sri Lanka's first hybrid logistics network — rail efficiency meets last-mile truck delivery.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg-base text-text-body font-sans">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
