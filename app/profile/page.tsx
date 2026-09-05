"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Train,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Save,
  CheckCircle2,
  ArrowLeft,
  Bell,
  Plus,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface SavedAddress {
  id: string;
  title: string;
  address: string;
  hub: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const [name, setName] = useState("Sunil Wickramasinghe");
  const [email, setEmail] = useState("sunil@kandycargo.lk");
  const [phone, setPhone] = useState("+94 77 890 1234");
  const [company, setCompany] = useState("Central Highlands Spice & Tea Traders");

  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsSms, setNotificationsSms] = useState(true);
  const [preferredSlot, setPreferredSlot] = useState("06:30 AM — Express Freight 101");

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([
    {
      id: "addr-1",
      title: "Kandy Main Warehouse (Pickup)",
      address: "No. 78, Peradeniya Road, Kandy",
      hub: "Kandy Goods Shed",
      isDefault: true,
    },
    {
      id: "addr-2",
      title: "Colombo Fort Distribution Office",
      address: "No. 42, Reclamation Road, Colombo 11",
      hub: "Colombo Fort Station",
      isDefault: false,
    },
    {
      id: "addr-3",
      title: "Galle Southern Depot",
      address: "Warehouse B, Station Road, Galle",
      hub: "Galle Central Hub",
      isDefault: false,
    },
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  function removeAddress(id: string) {
    setSavedAddresses(savedAddresses.filter((a) => a.id !== id));
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
          <Button variant="primary" size="sm" href="/order/new">
            Book Shipment
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-text-heading">
            Account & Logistics Profile
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your merchant credentials, railway dispatch defaults, and registered address hubs.
          </p>
        </div>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3 text-green-800 text-sm"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <span>Profile and dispatch preferences updated successfully!</span>
          </motion.div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal & Business Info */}
          <div className="glass p-6 md:p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-text-heading mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-green-700" />
              Merchant Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">
                  Full Name / Contact Person
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">
                  Business / Trading Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dispatch & Freight Preferences */}
          <div className="glass p-6 md:p-8 rounded-2xl">
            <h2 className="text-lg font-bold text-text-heading mb-6 flex items-center gap-2">
              <Train className="h-5 w-5 text-green-700" />
              Railway Freight Preferences
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1.5">
                  Preferred Daily Freight Departure Slot
                </label>
                <select
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="input-field max-w-md"
                >
                  <option value="06:30 AM — Express Freight 101">06:30 AM — Express Freight 101 (Priority)</option>
                  <option value="11:15 AM — Intercity Cargo 205">11:15 AM — Intercity Cargo 205</option>
                  <option value="03:45 PM — Mainline Freight 312">03:45 PM — Mainline Freight 312</option>
                  <option value="09:00 PM — Night Express 404">09:00 PM — Night Express 404</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <div className="text-sm font-medium text-text-heading flex items-center gap-2">
                  <Bell className="h-4 w-4 text-green-700" />
                  Consignment Updates & Notifications
                </div>
                <label className="flex items-center gap-2.5 text-sm text-text-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEmail}
                    onChange={(e) => setNotificationsEmail(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>Email alerts for train dispatch and arrival milestones</span>
                </label>
                <label className="flex items-center gap-2.5 text-sm text-text-body cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsSms}
                    onChange={(e) => setNotificationsSms(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span>SMS dispatch alerts with live tracking link</span>
                </label>
              </div>
            </div>
          </div>

          {/* Saved Delivery & Hub Addresses */}
          <div className="glass p-6 md:p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-heading flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-700" />
                Saved Dispatch Hubs & Addresses
              </h2>
            </div>

            <div className="space-y-4">
              {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-xl border border-gray-200/80 bg-white/50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-text-heading text-sm">
                        {addr.title}
                      </span>
                      {addr.isDefault && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted">{addr.address}</div>
                    <div className="text-xs font-mono text-green-700 mt-0.5">
                      Hub: {addr.hub}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => removeAddress(addr.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <Button variant="secondary" href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <Button variant="primary" type="submit">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
