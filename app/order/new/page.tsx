"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Train,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Truck,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface CargoCategory {
  id: string;
  name: string;
  desc: string;
  baseRatePerKg: number;
  icon: string;
}

const CARGO_TYPES: CargoCategory[] = [
  { id: "tea", name: "Ceylon Tea & Spices", desc: "Moisture-sealed crates", baseRatePerKg: 18, icon: "🍃" },
  { id: "produce", name: "Fresh Produce / FMCG", desc: "Temperature controlled", baseRatePerKg: 22, icon: "📦" },
  { id: "textile", name: "Garments & Textiles", desc: "Standard boxed freight", baseRatePerKg: 15, icon: "👕" },
  { id: "general", name: "General Dry Cargo", desc: "Secured palletized goods", baseRatePerKg: 16, icon: "📦" },
];

interface DestinationHub {
  id: string;
  name: string;
  station: string;
  distanceKm: number;
  transitHours: number;
  baseFee: number;
}

const HUBS: DestinationHub[] = [
  { id: "CMB", name: "Colombo", station: "Colombo Fort Station", distanceKm: 115, transitHours: 3.5, baseFee: 850 },
  { id: "NEG", name: "Negombo", station: "Negombo Hub", distanceKm: 130, transitHours: 4.2, baseFee: 950 },
  { id: "GAL", name: "Galle", station: "Galle Central Hub", distanceKm: 235, transitHours: 5.5, baseFee: 1400 },
  { id: "MAT", name: "Matara", station: "Matara Railway Hub", distanceKm: 275, transitHours: 6.0, baseFee: 1600 },
  { id: "JAF", name: "Jaffna", station: "Jaffna Railway Hub", distanceKm: 320, transitHours: 7.5, baseFee: 1950 },
  { id: "TRN", name: "Trincomalee", station: "Trincomalee Freight Hub", distanceKm: 180, transitHours: 5.0, baseFee: 1300 },
];

export default function NewOrderPage() {
  const [step, setStep] = useState(1);

  // Form state
  const [cargoType, setCargoType] = useState(CARGO_TYPES[0].id);
  const [weightKg, setWeightKg] = useState("25");
  const [cargoDescription, setCargoDescription] = useState("");

  const [selectedHub, setSelectedHub] = useState(HUBS[0].id);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [slot, setSlot] = useState("06:30 - Express Rail 101");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);

  const currentHub = HUBS.find((h) => h.id === selectedHub) || HUBS[0];
  const currentCargo = CARGO_TYPES.find((c) => c.id === cargoType) || CARGO_TYPES[0];

  const weightNum = parseFloat(weightKg) || 1;
  const calculatedCost = Math.round(currentHub.baseFee + weightNum * currentCargo.baseRatePerKg);

  function handleConfirm() {
    setIsSubmitting(true);
    setTimeout(() => {
      const trackingCode = `KP-${Math.floor(10000 + Math.random() * 90000)}-${currentHub.id}`;
      setCompletedOrder(trackingCode);
      setIsSubmitting(false);
    }, 900);
  }

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top Bar */}
      <div className="mx-auto max-w-4xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-text-heading no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            My Orders
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/profile"
            className="text-sm font-medium text-text-muted hover:text-green-600 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Step Indicator */}
        {!completedOrder && (
          <div className="mb-8">
            <div className="flex items-center justify-between max-w-xl mx-auto relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-green-100 -z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 -z-0 transition-all duration-300"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />

              {[
                { num: 1, label: "Cargo" },
                { num: 2, label: "Destination" },
                { num: 3, label: "Schedule" },
                { num: 4, label: "Confirm" },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1 relative z-10">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                      step >= s.num
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-text-muted border border-green-200"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span className="text-xs font-medium text-text-muted">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Card */}
        <AnimatePresence mode="wait">
          {completedOrder ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-8 md:p-12 text-center rounded-2xl max-w-lg mx-auto"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-text-heading mb-2">Order Confirmed!</h2>
              <p className="text-text-muted text-sm mb-6">
                Your shipment has been scheduled with Sri Lanka Railways freight dispatch from Kandy.
              </p>

              <div className="rounded-xl bg-white/70 border border-green-100 p-4 mb-8 text-left">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Tracking Number</div>
                <div className="font-mono text-xl font-bold text-green-700 mb-3">{completedOrder}</div>
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-green-50 pt-3">
                  <div>
                    <span className="text-text-muted">Destination:</span> {currentHub.name} ({currentHub.station})
                  </div>
                  <div>
                    <span className="text-text-muted">Total:</span> Rs. {calculatedCost.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="primary" href={`/orders/${completedOrder}/track`}>
                  Track Shipment
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" href="/orders">
                  View All Orders
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="glass p-6 md:p-10 rounded-2xl"
            >
              {/* STEP 1: CARGO DETAILS */}
              {step === 1 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-heading">1. Select Cargo & Specifications</h2>
                    <p className="text-sm text-text-muted">Choose your cargo category and specify weight.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {CARGO_TYPES.map((cargo) => (
                      <div
                        key={cargo.id}
                        onClick={() => setCargoType(cargo.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          cargoType === cargo.id
                            ? "border-green-600 bg-green-50/60 shadow-sm ring-2 ring-green-600/20"
                            : "border-gray-200/80 bg-white/40 hover:bg-white/80"
                        }`}
                      >
                        <div className="text-2xl mb-2">{cargo.icon}</div>
                        <div className="font-semibold text-text-heading">{cargo.name}</div>
                        <div className="text-xs text-text-muted mb-2">{cargo.desc}</div>
                        <div className="text-xs font-semibold text-green-700">
                          Rs. {cargo.baseRatePerKg}/kg rail tariff
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Cargo Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5000"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="input-field"
                        placeholder="e.g. 50"
                      />
                      <span className="text-xs text-text-muted mt-1 block">
                        Bulk discount applies over 500 kg
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Package Description & Notes
                      </label>
                      <input
                        type="text"
                        value={cargoDescription}
                        onChange={(e) => setCargoDescription(e.target.value)}
                        className="input-field"
                        placeholder="e.g. 4 crates of high-grown black tea"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-8">
                    <Button
                      variant="primary"
                      onClick={() => setStep(2)}
                      disabled={!weightKg || parseFloat(weightKg) <= 0}
                    >
                      Next: Destination
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 2: DESTINATION HUB */}
              {step === 2 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-heading">2. Choose Regional Hub & Recipient</h2>
                    <p className="text-sm text-text-muted">
                      Select which railway hub the shipment will route to from Kandy Railway Station.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {HUBS.map((hub) => (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedHub(hub.id)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          selectedHub === hub.id
                            ? "border-green-600 bg-green-50/60 shadow-sm ring-2 ring-green-600/20"
                            : "border-gray-200/80 bg-white/40 hover:bg-white/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-text-heading">{hub.name}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-mono">
                            {hub.id}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mb-2">{hub.station}</div>
                        <div className="text-xs text-text-body">
                          <div>📍 {hub.distanceKm} km from Kandy</div>
                          <div>⏱️ ~{hub.transitHours} hrs via Rail</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="input-field"
                        placeholder="e.g. Sunil Perera"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Recipient Phone
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        className="input-field"
                        placeholder="+94 77 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-heading mb-1.5">
                      Last-Mile Delivery Street Address
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="input-field"
                      placeholder="e.g. No. 45, Galle Road, Colombo 03"
                    />
                  </div>

                  <div className="flex justify-between items-center mt-8">
                    <Button variant="secondary" onClick={() => setStep(1)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button variant="primary" onClick={() => setStep(3)}>
                      Next: Schedule
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 3: SCHEDULE & TRAIN SLOT */}
              {step === 3 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-heading">3. Booking Date & Rail Slot</h2>
                    <p className="text-sm text-text-muted">
                      Book up to 7 days ahead for guaranteed railway freight wagon allocation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Dispatch Date (Next 7 Days)
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-heading mb-1.5">
                        Rail Departure Slot
                      </label>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="input-field"
                      >
                        <option value="06:30 - Express Rail 101">06:30 AM — Express Freight 101 (Priority)</option>
                        <option value="11:15 - Intercity Rail 205">11:15 AM — Intercity Cargo 205</option>
                        <option value="15:45 - Mainline Freight 312">03:45 PM — Mainline Freight 312</option>
                        <option value="21:00 - Night Express 404">09:00 PM — Night Overnight Cargo 404</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 mb-6 flex items-start gap-3">
                    <ShieldCheck className="h-6 w-6 text-green-700 shrink-0 mt-0.5" />
                    <div className="text-sm text-text-body">
                      <strong className="text-text-heading">Rail + Road Guarantee:</strong> Your goods are picked up in Kandy, loaded directly onto the Ceylon Railway cargo carriage, transferred to regional hub trucks, and delivered door-to-door with tamper-evident tracking.
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-8">
                    <Button variant="secondary" onClick={() => setStep(2)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button variant="primary" onClick={() => setStep(4)}>
                      Next: Review Summary
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP 4: SUMMARY & CONFIRM */}
              {step === 4 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-heading">4. Review & Confirm Shipment</h2>
                    <p className="text-sm text-text-muted">Verify details before placing order into the dispatch queue.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="rounded-xl bg-white/70 border border-gray-200/80 p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-3 flex items-center gap-1.5">
                        <Package className="h-4 w-4" /> Freight Info
                      </div>
                      <div className="space-y-2 text-sm text-text-body">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Cargo Type:</span>
                          <span className="font-semibold">{currentCargo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Weight:</span>
                          <span className="font-semibold">{weightNum} kg</span>
                        </div>
                        {cargoDescription && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">Description:</span>
                            <span className="font-medium text-right">{cargoDescription}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/70 border border-gray-200/80 p-5">
                      <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-3 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> Route & Timing
                      </div>
                      <div className="space-y-2 text-sm text-text-body">
                        <div className="flex justify-between">
                          <span className="text-text-muted">Origin:</span>
                          <span className="font-semibold">Kandy Freight Station</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Destination Hub:</span>
                          <span className="font-semibold">{currentHub.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-muted">Date & Slot:</span>
                          <span className="font-semibold">{bookingDate} ({slot.split(" - ")[0]})</span>
                        </div>
                        {recipientName && (
                          <div className="flex justify-between">
                            <span className="text-text-muted">Recipient:</span>
                            <span className="font-medium">{recipientName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="rounded-xl bg-green-50/80 border border-green-200/80 p-5 mb-6">
                    <div className="text-xs font-bold uppercase tracking-wider text-green-800 mb-3 flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4" /> Tariff Estimate
                    </div>
                    <div className="space-y-2 text-sm text-text-body">
                      <div className="flex justify-between">
                        <span>Base Hub & Handling Fee:</span>
                        <span>Rs. {currentHub.baseFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rail Freight ({weightNum} kg × Rs. {currentCargo.baseRatePerKg}):</span>
                        <span>Rs. {(weightNum * currentCargo.baseRatePerKg).toLocaleString()}</span>
                      </div>
                      <hr className="border-green-200" />
                      <div className="flex justify-between text-base font-bold text-text-heading">
                        <span>Total Cost:</span>
                        <span className="text-green-700">Rs. {calculatedCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-8">
                    <Button variant="secondary" onClick={() => setStep(3)}>
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Allocating Train Slot..." : "Confirm & Book Dispatch"}
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
