"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import {
  Train,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  AlertCircle,
  Package,
  Calendar,
  Share2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface TrackingMilestone {
  title: string;
  location: string;
  time: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export default function OrderTrackPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "KP-78291-CMB";

  const [copied, setCopied] = useState(false);

  const milestones: TrackingMilestone[] = [
    {
      title: "Order Received & Verified",
      location: "Kandy Logistics Hub, Peradeniya Rd",
      time: "Sep 04, 05:15 AM",
      description: "Freight weighed, inspected, and palletized for rail transit.",
      completed: true,
      active: false,
    },
    {
      title: "Loaded onto Freight Carriage",
      location: "Kandy Railway Goods Yard",
      time: "Sep 04, 06:10 AM",
      description: "Cargo loaded onto Sri Lanka Railways Wagon #W-419 (Express 101).",
      completed: true,
      active: false,
    },
    {
      title: "In Transit via Main Line Rail",
      location: "Passing Polgahawela Junction",
      time: "Sep 04, 08:25 AM",
      description: "Rail freight progressing on schedule. Speed: 52 km/h.",
      completed: true,
      active: true,
    },
    {
      title: "Arrival at Regional Rail Hub",
      location: "Colombo Fort Goods Shed",
      time: "Estimated Sep 04, 09:45 AM",
      description: "Carriage de-coupling and transfer to last-mile dispatch fleet.",
      completed: false,
      active: false,
    },
    {
      title: "Out for Last-Mile Truck Delivery",
      location: "Colombo Metro Distribution",
      time: "Estimated Sep 04, 11:00 AM",
      description: "Dispatched via delivery van #WP-CAD-9921 to recipient doorstep.",
      completed: false,
      active: false,
    },
    {
      title: "Delivered & Signed",
      location: "Recipient Destination",
      time: "Estimated Sep 04, 12:30 PM",
      description: "Delivery receipt confirmed with digital signature.",
      completed: false,
      active: false,
    },
  ];

  function copyTrackingLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top Bar */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-heading no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Header Glass Card */}
        <div className="glass p-6 md:p-8 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-glass-border">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-mono text-2xl font-bold text-text-heading">
                  {orderId}
                </h1>
                <StatusPill status="transit" label="In Transit on Rail" />
              </div>
              <p className="text-sm text-text-muted">
                Kandy Central Goods Shed → Colombo Fort Hub → Doorstep
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyTrackingLink}
                className="btn-secondary px-4 py-2 text-xs flex items-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                {copied ? "Link Copied!" : "Share Tracking"}
              </button>
              <Button variant="primary" size="sm" href="/order/new">
                New Order
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-sm">
            <div>
              <span className="text-xs text-text-muted block">Estimated Delivery</span>
              <strong className="text-text-heading font-semibold">Today, ~12:30 PM</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Freight Service</span>
              <strong className="text-text-heading font-semibold">Rail Express 101</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Cargo Weight</span>
              <strong className="text-text-heading font-semibold">120 kg (4 Crates)</strong>
            </div>
            <div>
              <span className="text-xs text-text-muted block">Recipient</span>
              <strong className="text-text-heading font-semibold">Lanka Freight Ltd</strong>
            </div>
          </div>
        </div>

        {/* Content Grid: Timeline + Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Timeline (2 cols) */}
          <div className="lg:col-span-2 glass p-6 md:p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-text-heading mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-700" />
              Live Journey Milestones
            </h2>

            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-green-100">
              {milestones.map((milestone, idx) => (
                <div key={idx} className="relative group">
                  {/* Step Dot */}
                  <div
                    className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                      milestone.completed
                        ? "bg-green-600 text-white shadow-sm"
                        : milestone.active
                        ? "bg-green-600 text-white ring-4 ring-green-100 animate-pulse"
                        : "bg-white border-2 border-gray-200 text-transparent"
                    }`}
                  >
                    {milestone.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : milestone.active ? (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    ) : null}
                  </div>

                  {/* Milestone Content */}
                  <div className="pl-4">
                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-1">
                      <h3
                        className={`text-sm font-semibold ${
                          milestone.active
                            ? "text-green-700 font-bold"
                            : milestone.completed
                            ? "text-text-heading"
                            : "text-text-muted"
                        }`}
                      >
                        {milestone.title}
                        {milestone.active && (
                          <span className="ml-2 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                            CURRENT
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-text-muted font-mono">{milestone.time}</span>
                    </div>

                    <div className="text-xs font-medium text-text-heading flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-green-600 shrink-0" />
                      {milestone.location}
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipment Details Sidebar (1 col) */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider text-green-700 mb-4 flex items-center gap-2">
                <Train className="h-4 w-4" /> Rail Segment
              </h3>
              <div className="space-y-3 text-xs text-text-body">
                <div className="flex justify-between">
                  <span className="text-text-muted">Locomotive:</span>
                  <span className="font-semibold">M10 Diesel Electric</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Carriage No:</span>
                  <span className="font-semibold">SLR-CRG-8812</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Dispatched At:</span>
                  <span className="font-semibold">06:15 AM (Kandy)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Hub Destination:</span>
                  <span className="font-semibold">Colombo Fort (Platform 4)</span>
                </div>
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-text-heading uppercase tracking-wider text-green-700 mb-4 flex items-center gap-2">
                <Truck className="h-4 w-4" /> Road Delivery
              </h3>
              <div className="space-y-3 text-xs text-text-body">
                <div className="flex justify-between">
                  <span className="text-text-muted">Partner Fleet:</span>
                  <span className="font-semibold">Kandypack Metro Express</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Delivery Address:</span>
                  <span className="font-semibold text-right">No. 12, MacCallum Rd, Colombo 10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Special Handling:</span>
                  <span className="font-semibold">Fragile • Dry Goods</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-200 bg-green-50/60 p-5">
              <div className="flex items-center gap-2 text-xs font-bold text-green-800 mb-1">
                <AlertCircle className="h-4 w-4" /> Need assistance?
              </div>
              <p className="text-xs text-text-muted mb-3">
                Our Kandy Operations Desk is available 24/7 for freight inquiries and dispatch updates.
              </p>
              <div className="text-xs font-bold text-green-700">
                Hotline: +94 81 223 4455
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
