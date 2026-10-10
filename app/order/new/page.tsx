"use client";

import { useState, useEffect } from "react";
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
  Truck,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Bell,
  Scale,
  Box,
  Layers,
  Search,
  ExternalLink,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";
import {
  AlertsSidebar,
  NotificationBellButton,
} from "@/components/notifications/AlertsSidebar";

interface CatalogueProduct {
  product_id: number;
  product_name: string;
  category: string;
  unit_price: number;
  unit_weight_kg: number;
  space_consumption_rate: number;
  description: string;
  image_url: string;
}

const FALLBACK_PRODUCTS: CatalogueProduct[] = [
  {
    product_id: 1,
    product_name: "Kandy Pure Ceylon BOPF Tea (25kg Crate)",
    category: "Ceylon Tea & Spices",
    unit_price: 4500,
    unit_weight_kg: 25,
    space_consumption_rate: 0.05,
    description: "High-grown export grade Ceylon Black BOPF tea packed in moisture-resistant foil-lined wooden crates.",
    image_url: "/products/tea_crate.jpg",
  },
  {
    product_id: 2,
    product_name: "Ceylon Spices & Cinnamon Sack (20kg)",
    category: "Ceylon Tea & Spices",
    unit_price: 3800,
    unit_weight_kg: 20,
    space_consumption_rate: 0.04,
    description: "Sun-cured Ceylon alba cinnamon sticks, premium cardamom pods, and organic cloves in heavy-duty jute sacks.",
    image_url: "/products/spices_sack.jpg",
  },
  {
    product_id: 3,
    product_name: "Nuwara Eliya Highland Vegetables Crate (30kg)",
    category: "Fresh Produce & FMCG",
    unit_price: 2600,
    unit_weight_kg: 30,
    space_consumption_rate: 0.08,
    description: "Ventilated farm-fresh crates of premium highland carrots, leeks, bell peppers, and cabbage for rapid rail transit.",
    image_url: "/products/produce_crates.jpg",
  },
  {
    product_id: 4,
    product_name: "Ceylon Virgin Coconut Oil Canister (20L / 18kg)",
    category: "Fresh Produce & FMCG",
    unit_price: 4200,
    unit_weight_kg: 18,
    space_consumption_rate: 0.045,
    description: "Cold-pressed extra-virgin coconut oil in food-grade sealed HDPE transit containers.",
    image_url: "/products/coconut_oil.jpg",
  },
  {
    product_id: 5,
    product_name: "Kandy Handloom Cotton Textile Bolts (25kg)",
    category: "Garments & Textiles",
    unit_price: 5200,
    unit_weight_kg: 25,
    space_consumption_rate: 0.06,
    description: "Protective shrink-wrapped bolts of traditional Sri Lankan batik and handloom cotton textiles for commercial retail.",
    image_url: "/products/textile_rolls.jpg",
  },
  {
    product_id: 6,
    product_name: "Apparel & Garment Export Cartons (20kg)",
    category: "Garments & Textiles",
    unit_price: 4800,
    unit_weight_kg: 20,
    space_consumption_rate: 0.055,
    description: "Triple-wall corrugated export master cartons of finished garments with security straps and barcoded tags.",
    image_url: "/products/garments_box.jpg",
  },
  {
    product_id: 7,
    product_name: "Traditional Brassware & Metal Crafts Crate (35kg)",
    category: "Hardware & Industrial",
    unit_price: 7500,
    unit_weight_kg: 35,
    space_consumption_rate: 0.07,
    description: "Handcrafted polished brass oil lamps, brassware, and cultural souvenirs cushioned in protective wooden crates.",
    image_url: "/products/brassware_crate.jpg",
  },
  {
    product_id: 8,
    product_name: "Precision Industrial Machinery Spares (40kg)",
    category: "Hardware & Industrial",
    unit_price: 8900,
    unit_weight_kg: 40,
    space_consumption_rate: 0.085,
    description: "High-grade steel gears, shafts, and mechanical components packed in shock-absorbing foam-lined transport cases.",
    image_url: "/products/machinery_parts.jpg",
  },
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
  { id: "CMB", name: "Colombo", station: "Colombo Fort Goods Shed", distanceKm: 115, transitHours: 3.5, baseFee: 850 },
  { id: "NEG", name: "Negombo", station: "Negombo Hub", distanceKm: 130, transitHours: 4.2, baseFee: 950 },
  { id: "GAL", name: "Galle", station: "Galle Central Hub", distanceKm: 235, transitHours: 5.5, baseFee: 1400 },
  { id: "MAT", name: "Matara", station: "Matara Railway Hub", distanceKm: 275, transitHours: 6.0, baseFee: 1600 },
  { id: "JAF", name: "Jaffna", station: "Jaffna Railway Hub", distanceKm: 320, transitHours: 7.5, baseFee: 1950 },
  { id: "TRN", name: "Trincomalee", station: "Trincomalee Freight Hub", distanceKm: 180, transitHours: 5.0, baseFee: 1300 },
];

const CATEGORIES = [
  { id: "ALL", label: "All Items", icon: "📦" },
  { id: "Ceylon Tea & Spices", label: "Ceylon Tea & Spices", icon: "🍵" },
  { id: "Fresh Produce & FMCG", label: "Fresh Produce & FMCG", icon: "🥦" },
  { id: "Garments & Textiles", label: "Garments & Textiles", icon: "👕" },
  { id: "Hardware & Industrial", label: "Hardware & Industrial", icon: "🏺" },
];

interface DeliveryRouteOption {
  route_id: number;
  route_name: string;
  station_id: number;
  city: string;
  max_delivery_time?: string;
  station_address?: string;
}

const FALLBACK_ROUTES: Record<string, DeliveryRouteOption[]> = {
  CMB: [
    { route_id: 1, route_name: "Colombo Central Commercial Route", station_id: 1, city: "Colombo", max_delivery_time: "04:30:00" },
    { route_id: 2, route_name: "Greater Colombo Industrial Hub Route", station_id: 1, city: "Colombo", max_delivery_time: "06:00:00" },
  ],
  GAL: [
    { route_id: 3, route_name: "Galle Coastal Route", station_id: 3, city: "Galle", max_delivery_time: "05:00:00" },
  ],
  NEG: [
    { route_id: 4, route_name: "Negombo Coastal & Industrial Route", station_id: 2, city: "Negombo", max_delivery_time: "04:00:00" },
  ],
  MAT: [
    { route_id: 5, route_name: "Matara Southern Express Route", station_id: 4, city: "Matara", max_delivery_time: "04:30:00" },
  ],
  JAF: [
    { route_id: 6, route_name: "Jaffna Northern Peninsula Route", station_id: 5, city: "Jaffna", max_delivery_time: "05:00:00" },
  ],
  TRN: [
    { route_id: 7, route_name: "Trincomalee Eastern Port Route", station_id: 6, city: "Trincomalee", max_delivery_time: "04:30:00" },
  ],
};

export default function NewOrderPage() {
  const [step, setStep] = useState(1);
  const [products, setProducts] = useState<CatalogueProduct[]>(FALLBACK_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Cart state: product_id -> quantity
  const [cart, setCart] = useState<Record<number, number>>({ 1: 1 });

  // Destination & recipient state
  const [selectedHub, setSelectedHub] = useState(HUBS[0].id);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // Delivery routes state
  const [routesList, setRoutesList] = useState<DeliveryRouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<number>(1);

  // Schedule state
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [slot, setSlot] = useState("06:30 AM Express Rail 101");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const [notifiedManagersCount, setNotifiedManagersCount] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"unread" | "history">("unread");
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch live catalogue & delivery routes from backend
  useEffect(() => {
    async function loadCatalogue() {
      try {
        const res = await fetch("/api/v1/orders/catalogue");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          }
        }
      } catch (err) {
        console.error("Failed to load backend catalogue, using built-in catalogue", err);
      }
    }

    async function loadRoutes() {
      try {
        const res = await fetch("/api/v1/orders/routes");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setRoutesList(data);
          }
        }
      } catch (err) {
        console.error("Failed to load routes from backend", err);
      }
    }

    loadCatalogue();
    loadRoutes();
  }, []);

  const currentHub = HUBS.find((h) => h.id === selectedHub) || HUBS[0];

  // Available routes for the selected hub
  const availableRoutesForHub = (() => {
    const hubCity = currentHub.name.toLowerCase();
    const filtered = routesList.filter((r) => (r.city || "").toLowerCase() === hubCity);
    if (filtered.length > 0) return filtered;
    return FALLBACK_ROUTES[selectedHub] || FALLBACK_ROUTES.CMB;
  })();

  // Synchronize selected route when hub changes
  useEffect(() => {
    if (availableRoutesForHub.length > 0) {
      const exists = availableRoutesForHub.some((r) => r.route_id === selectedRouteId);
      if (!exists) {
        setSelectedRouteId(availableRoutesForHub[0].route_id);
      }
    }
  }, [selectedHub, availableRoutesForHub, selectedRouteId]);

  const currentRoute = availableRoutesForHub.find((r) => r.route_id === selectedRouteId) || availableRoutesForHub[0];

  // Cart operations
  function updateQuantity(productId: number, delta: number) {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  }

  function setDirectQuantity(productId: number, qty: number) {
    setCart((prev) => {
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: qty };
    });
  }

  // Filtered catalogue
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Selected products breakdown
  const selectedItemsList = products
    .filter((p) => (cart[p.product_id] || 0) > 0)
    .map((p) => ({
      ...p,
      quantity: cart[p.product_id] || 0,
      totalWeight: (cart[p.product_id] || 0) * p.unit_weight_kg,
      totalSpace: (cart[p.product_id] || 0) * p.space_consumption_rate,
      totalPrice: (cart[p.product_id] || 0) * p.unit_price,
    }));

  const totalItemsCount = selectedItemsList.reduce((acc, i) => acc + i.quantity, 0);
  const totalWeightKg = selectedItemsList.reduce((acc, i) => acc + i.totalWeight, 0);
  const totalWagonSpace = selectedItemsList.reduce((acc, i) => acc + i.totalSpace, 0);
  const totalGoodsValue = selectedItemsList.reduce((acc, i) => acc + i.totalPrice, 0);

  // Rail freight tariff: Base station handling fee + Rs 15 per kg
  const freightTariff = Math.round(currentHub.baseFee + totalWeightKg * 15);
  const grandTotal = totalGoodsValue + freightTariff;

  async function handleConfirm() {
    if (selectedItemsList.length === 0 || isSubmitting) return;
    setSubmissionError(null);
    if (![recipientName, recipientPhone, deliveryAddress].every((value) => value.trim())) {
      setSubmissionError("Provide the recipient name, phone and delivery address before checkout.");
      return;
    }
    setIsSubmitting(true);
    try {
      const itemsPayload = selectedItemsList.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_hub: currentHub.id,
          delivery_route_id: selectedRouteId,
          cargo_type: selectedItemsList[0]?.category || "General",
          cargo_description: selectedItemsList.map((i) => `${i.product_name} (${i.quantity})`).join(", "),
          weight_kg: totalWeightKg,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          delivery_address: deliveryAddress.trim(),
          booking_date: bookingDate,
          slot: slot,
          items: itemsPayload,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCompletedOrder(data.id || `KP-${data.order_id}-${currentHub.id}`);
        setNotifiedManagersCount(data.notified_managers || 1);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("kandypack:order_placed"));
        }
      } else {
        const data = await res.json().catch(() => null);
        const detail = data?.detail;
        throw new Error(typeof detail === "string" ? detail : detail?.message ?? "Order could not be saved. Check the destination details and retry.");
      }
    } catch (error: unknown) {
      setSubmissionError(error instanceof Error ? error.message : "Order could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen pb-24 pt-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-green-50/40 via-white to-green-50/20">
      <GradientBlobs />
      {submissionError && <p role="alert" className="relative mx-auto mb-5 max-w-5xl rounded-2xl border border-green-200 bg-green-50 p-4">{submissionError}</p>}

      {/* Top Bar */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-text-heading no-underline group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition-transform">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <NotificationBellButton
            onClick={() => {
              setSidebarTab("unread");
              setSidebarOpen(true);
            }}
            unreadCount={unreadCount}
          />
          <Link
            href="/orders"
            className="text-sm font-semibold text-text-muted hover:text-green-700 transition-colors"
          >
            Consignments
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/profile"
            className="text-sm font-semibold text-text-muted hover:text-green-700 transition-colors"
          >
            Profile
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
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
                { num: 1, label: "Catalogue" },
                { num: 2, label: "Destination" },
                { num: 3, label: "Schedule" },
                { num: 4, label: "Confirm" },
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-1.5 relative z-10">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all shadow-sm ${
                      step >= s.num
                        ? "bg-green-600 text-white ring-4 ring-green-100"
                        : "bg-white text-text-muted border border-green-200"
                    }`}
                  >
                    {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      step >= s.num ? "text-green-800" : "text-text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Order Confirmation View */}
        <AnimatePresence mode="wait">
          {completedOrder ? (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-glass p-8 md:p-12 text-center rounded-3xl max-w-xl mx-auto shadow-glass border border-white/80"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700 shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-black text-text-heading mb-1 tracking-tight">
                Consignment Booked Successfully!
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Your freight order has been registered and scheduled for rail allocation and delivery.
              </p>

              {/* Order Confirmation Notice */}
              <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/90 p-4 mb-6 text-left flex items-start gap-3 shadow-2xs">
                <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Booking Confirmed & Queued
                  </div>
                  <div className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    A confirmation receipt has been sent to your contact details. Our team is scheduling your cargo onto the upcoming scheduled train departure.
                  </div>
                </div>
              </div>

              {/* Consignment Specs Box */}
              <div className="rounded-2xl bg-white/80 border border-green-200/80 p-5 mb-8 text-left shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-green-100">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Tracking Number
                  </span>
                  <span className="font-mono text-base font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                    {completedOrder}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-muted block mb-0.5">Destination Hub:</span>
                    <strong className="text-text-heading">{currentHub.name} ({currentHub.station})</strong>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5">Total Freight Weight:</span>
                    <strong className="text-text-heading">{totalWeightKg.toFixed(1)} kg</strong>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5">Items Booked:</span>
                    <strong className="text-text-heading">{totalItemsCount} Unit(s)</strong>
                  </div>
                  <div>
                    <span className="text-text-muted block mb-0.5">Grand Total:</span>
                    <strong className="text-green-800 text-sm font-extrabold">
                      LKR {grandTotal.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="primary" size="md" href={`/orders/${completedOrder}/track`}>
                  Track Live Consignment
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button variant="secondary" size="md" href="/orders">
                  View All Consignments
                </Button>
              </div>
            </motion.div>
          ) : (
            /* WIZARD CARD */
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="card-glass p-6 md:p-8 rounded-3xl shadow-glass border border-white/80"
            >
              {/* ============================================================== */}
              {/* STEP 1: PRODUCT CATALOGUE BY CATEGORY                          */}
              {/* ============================================================== */}
              {step === 1 && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-text-heading tracking-tight flex items-center gap-2">
                        <Package className="h-6 w-6 text-green-600" />
                        1. Product Freight Catalogue
                      </h2>
                      <p className="text-sm text-text-muted mt-1">
                        Select items from each category and adjust the crate/package quantities for your rail consignment.
                      </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative min-w-[240px]">
                      <Search className="h-4 w-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl bg-white border border-green-200/80 pl-9 pr-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex flex-wrap gap-2 mb-6 pb-2 border-b border-green-100">
                    {CATEGORIES.map((cat) => {
                      const count =
                        cat.id === "ALL"
                          ? products.length
                          : products.filter((p) => p.category === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedCategory === cat.id
                              ? "bg-green-700 text-white shadow-sm shadow-green-900/10 ring-2 ring-green-600/30"
                              : "bg-white/80 hover:bg-white text-text-muted border border-green-200/60"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                          <span
                            className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                              selectedCategory === cat.id
                                ? "bg-green-800 text-green-100"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Products Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {filteredProducts.map((p) => {
                      const qty = cart[p.product_id] || 0;
                      return (
                        <div
                          key={p.product_id}
                          className={`rounded-2xl border p-4 bg-white/90 backdrop-blur-xs transition-all flex flex-col justify-between ${
                            qty > 0
                              ? "border-green-600 ring-2 ring-green-500/20 shadow-md shadow-green-900/5"
                              : "border-green-100/80 hover:border-green-300 shadow-xs"
                          }`}
                        >
                          <div className="flex gap-4">
                            {/* Product Image */}
                            <div className="h-28 w-28 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-green-100 relative group">
                              <img
                                src={p.image_url}
                                alt={p.product_name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                              <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                {p.unit_weight_kg} kg
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-green-700">
                                  {p.category}
                                </span>
                                <h3 className="font-bold text-text-heading text-sm line-clamp-2 leading-snug mt-0.5">
                                  {p.product_name}
                                </h3>
                                <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                                  {p.description}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] text-text-muted">
                                <span className="flex items-center gap-1">
                                  <Scale className="h-3 w-3 text-green-600" />
                                  {p.unit_weight_kg} kg/unit
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Box className="h-3 w-3 text-emerald-600" />
                                  {p.space_consumption_rate} m³ space
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Price & Quantity Selector */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-green-50">
                            <div>
                              <div className="text-[10px] uppercase font-bold text-text-muted">Unit Tariff</div>
                              <div className="text-base font-extrabold text-green-800">
                                LKR {p.unit_price.toLocaleString()}
                              </div>
                            </div>

                            {/* Counter */}
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => updateQuantity(p.product_id, 1)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-green-50 hover:bg-green-600 text-green-700 hover:text-white font-bold text-xs border border-green-200 hover:border-green-600 transition-all cursor-pointer active:scale-95"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add to Order
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-xl p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(p.product_id, -1)}
                                  className="h-7 w-7 rounded-lg bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                >
                                  {qty === 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max="999"
                                  value={qty}
                                  onChange={(e) => setDirectQuantity(p.product_id, parseInt(e.target.value) || 0)}
                                  className="w-10 text-center font-bold text-xs bg-transparent text-green-900 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(p.product_id, 1)}
                                  className="h-7 w-7 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Consignment Live Basket Summary Banner */}
                  <div className="rounded-2xl bg-gradient-to-r from-green-900 to-emerald-950 text-white p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                        <ShoppingCart className="h-6 w-6 text-green-300" />
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-green-200 font-bold">
                          Current Consignment Freight Total
                        </div>
                        <div className="text-xl font-black mt-0.5">
                          {totalItemsCount} Unit(s) • {totalWeightKg.toFixed(1)} kg Freight Weight
                        </div>
                        <div className="text-xs text-green-300/80 mt-0.5">
                          Estimated Wagon Space: {totalWagonSpace.toFixed(3)} units • Goods: LKR {totalGoodsValue.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={totalItemsCount === 0}
                      onClick={() => setStep(2)}
                      className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 text-slate-950 font-bold py-3 px-6 text-sm shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                      Next: Choose Destination
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 2: DESTINATION HUB & RECIPIENT                           */}
              {/* ============================================================== */}
              {step === 2 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-text-heading tracking-tight flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-green-600" />
                      2. Choose Regional Hub & Delivery Address
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                      Select which railway freight station the consignment will route to from Kandy Railway Goods Shed.
                    </p>
                  </div>

                  {/* Hub Selection Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {HUBS.map((hub) => (
                      <div
                        key={hub.id}
                        onClick={() => setSelectedHub(hub.id)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          selectedHub === hub.id
                            ? "border-green-600 bg-green-50/70 shadow-sm ring-2 ring-green-600/20"
                            : "border-green-100 bg-white/70 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-text-heading text-sm">{hub.name}</span>
                          <span className="text-[11px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-mono font-bold">
                            {hub.id}
                          </span>
                        </div>
                        <div className="text-xs text-text-muted mb-2 font-medium">{hub.station}</div>
                        <div className="text-xs text-text-body space-y-0.5 border-t border-green-100/60 pt-2">
                          <div>📍 {hub.distanceKm} km from Kandy Goods Yard</div>
                          <div>⏱️ ~{hub.transitHours} hrs via Sri Lanka Railways</div>
                          <div className="text-green-700 font-bold">Base Handling: LKR {hub.baseFee}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recipient Details Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-green-50/40 p-4 rounded-2xl border border-green-100">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-heading mb-1">
                        Recipient Business / Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                          maxLength={255} required
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Lanka Wholesale Stores Ltd"
                        className="w-full rounded-xl bg-white border border-green-200 px-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-heading mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="text"
                        value={recipientPhone}
                          maxLength={30} required
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="e.g. 0771234567"
                        className="w-full rounded-xl bg-white border border-green-200 px-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-heading mb-1">
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress}
                          maxLength={500} required
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="e.g. Colombo 03, Station Yard"
                        className="w-full rounded-xl bg-white border border-green-200 px-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Delivery Route Selector */}
                  <div className="mb-6 bg-white/90 p-5 rounded-2xl border border-green-200/90 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-green-100">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-green-800 flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-green-600" />
                          Last-Mile Delivery Route ({currentHub.name} Regional Hub)
                        </label>
                        <p className="text-xs text-text-muted mt-0.5">
                          Select the local distribution route from {currentHub.station} for final truck dispatch to the recipient.
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[11px] bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold">
                        Required
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableRoutesForHub.map((rt) => {
                        const isSelected = selectedRouteId === rt.route_id;
                        return (
                          <div
                            key={rt.route_id}
                            onClick={() => setSelectedRouteId(rt.route_id)}
                            className={`cursor-pointer rounded-xl border p-3.5 transition-all flex items-start gap-3 ${
                              isSelected
                                ? "border-green-600 bg-green-50/80 ring-2 ring-green-600/20 shadow-xs"
                                : "border-gray-200 bg-white hover:border-green-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="delivery_route"
                              checked={isSelected}
                              onChange={() => setSelectedRouteId(rt.route_id)}
                              className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-text-heading flex items-center justify-between gap-1">
                                <span className="truncate">{rt.route_name}</span>
                                <span className="text-[10px] text-gray-500 font-mono shrink-0">Route #{rt.route_id}</span>
                              </div>
                              <p className="text-[11px] text-text-muted mt-1 leading-snug">
                                Assigned regional distribution for {rt.city} and neighboring sectors
                              </p>
                              {rt.max_delivery_time && (
                                <div className="text-[10px] text-green-700 font-medium mt-1">
                                  ⏱️ Target Dispatch: ~{rt.max_delivery_time} window
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-green-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-green-200 text-xs font-bold text-text-heading hover:bg-white transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Catalogue
                    </button>

                    <Button variant="primary" size="md" disabled={![recipientName, recipientPhone, deliveryAddress].every((value) => value.trim())} onClick={() => setStep(3)}>
                      Next: Rail Schedule
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 3: SCHEDULE & TRAIN SLOT                                 */}
              {/* ============================================================== */}
              {step === 3 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-text-heading tracking-tight flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-green-600" />
                      3. Dispatch Date & Train Departure Slot
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                      Choose when the freight should depart from Kandy Goods Yard on the mainline rail corridor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-heading mb-1.5">
                        Departure Date
                      </label>
                      <input
                        type="date"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full rounded-xl bg-white border border-green-200 px-3.5 py-2.5 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-text-heading mb-1.5">
                        Preferred Railway Freight Slot
                      </label>
                      <select
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                        className="w-full rounded-xl bg-white border border-green-200 px-3.5 py-2.5 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                      >
                        <option value="06:30 AM Express Rail 101">06:30 AM - Morning Express Freight 101</option>
                        <option value="11:15 AM Intercity Rail 205">11:15 AM - Midday Intercity Freight 205</option>
                        <option value="09:00 PM Night Mail Express 404">09:00 PM - Heavy Night Freight 404</option>
                      </select>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 mb-6 text-xs text-amber-900 leading-relaxed flex items-center gap-3">
                    <Train className="h-5 w-5 text-amber-600 shrink-0" />
                    <span>
                      Sri Lanka Railways operates dedicated freight carriages attached to scheduled trains.
                      Upon placement, the <strong>Logistics Manager</strong> verifies wagon availability and assigns the trip.
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-green-100">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-green-200 text-xs font-bold text-text-heading hover:bg-white transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Destination
                    </button>

                    <Button variant="primary" size="md" onClick={() => setStep(4)}>
                      Next: Review Consignment
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 4: REVIEW & CONFIRM                                      */}
              {/* ============================================================== */}
              {step === 4 && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-black text-text-heading tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      4. Review Consignment & Dispatch to Rail
                    </h2>
                    <p className="text-sm text-text-muted mt-1">
                      Verify your selected freight items, destination hub, and confirm order placement.
                    </p>
                  </div>

                  {/* Consignment Items Table */}
                  <div className="rounded-2xl border border-green-200 overflow-hidden mb-6 bg-white/90 shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-green-50/80 text-green-900 font-bold uppercase tracking-wider border-b border-green-200/80">
                        <tr>
                          <th className="py-3 px-4">Item Details</th>
                          <th className="py-3 px-4 text-center">Unit Wt</th>
                          <th className="py-3 px-4 text-center">Qty</th>
                          <th className="py-3 px-4 text-right">Total Wt</th>
                          <th className="py-3 px-4 text-right">Subtotal (LKR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-50">
                        {selectedItemsList.map((item) => (
                          <tr key={item.product_id} className="hover:bg-green-50/40">
                            <td className="py-2.5 px-4 flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-10 w-10 rounded-lg object-cover border border-green-100 shrink-0"
                              />
                              <div>
                                <strong className="text-text-heading block">{item.product_name}</strong>
                                <span className="text-[10px] text-green-700 font-medium">{item.category}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-center text-text-muted">{item.unit_weight_kg} kg</td>
                            <td className="py-2.5 px-4 text-center font-bold text-text-heading">{item.quantity}</td>
                            <td className="py-2.5 px-4 text-right font-medium text-text-heading">{item.totalWeight.toFixed(1)} kg</td>
                            <td className="py-2.5 px-4 text-right font-bold text-green-800">
                              LKR {item.totalPrice.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Route & Recipient Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl bg-white/80 border border-green-100 p-4 text-xs space-y-1.5">
                      <div className="text-[11px] font-bold text-green-800 uppercase tracking-wider mb-2">
                        Rail Route Details
                      </div>
                      <div><strong>Destination Hub:</strong> {currentHub.name} ({currentHub.station})</div>
                      <div><strong>Delivery Route:</strong> {currentRoute?.route_name || `Route #${selectedRouteId}`}</div>
                      <div><strong>Distance:</strong> {currentHub.distanceKm} km from Kandy Central Goods Yard</div>
                      <div><strong>Scheduled Departure:</strong> {bookingDate} ({slot})</div>
                    </div>

                    <div className="rounded-2xl bg-white/80 border border-green-100 p-4 text-xs space-y-1.5">
                      <div className="text-[11px] font-bold text-green-800 uppercase tracking-wider mb-2">
                        Recipient & Destination
                      </div>
                      <div><strong>Recipient:</strong> {recipientName || "Not provided"}</div>
                      <div><strong>Contact:</strong> {recipientPhone || "Not provided"}</div>
                      <div><strong>Delivery Address:</strong> {deliveryAddress || "Not provided"}</div>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Manager Notification Notice */}
                  <div className="rounded-2xl bg-green-50 border border-green-200 p-4 mb-6">
                    <div className="flex items-center justify-between text-xs text-text-muted pb-2 border-b border-green-200/60">
                      <span>Cargo Value Subtotal:</span>
                      <strong className="text-text-heading">LKR {totalGoodsValue.toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-muted py-2 border-b border-green-200/60">
                      <span>Railway Freight Tariff ({totalWeightKg.toFixed(1)} kg @ Hub rate):</span>
                      <strong className="text-text-heading">LKR {freightTariff.toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-base font-extrabold text-green-900 pt-2.5">
                      <span>Grand Total:</span>
                      <span>LKR {grandTotal.toLocaleString()}</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-green-200/60 text-xs text-green-800 flex items-center gap-2">
                      <Train className="h-4 w-4 text-green-600 shrink-0" />
                      <span>
                        Upon confirming, your cargo reservation will be queued immediately for railway freight dispatch.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-green-200 text-xs font-bold text-text-heading hover:bg-white transition-all cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Schedule
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirm}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3 px-8 text-sm shadow-md shadow-green-900/15 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                          Placing Consignment...
                        </>
                      ) : (
                        <>
                          Confirm & Dispatch Consignment
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide-over Logistics Alerts & History Sidebar Drawer */}
      <AlertsSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        initialTab={sidebarTab}
        onNotificationsUpdated={(cnt) => setUnreadCount(cnt)}
      />
    </div>
  );
}

