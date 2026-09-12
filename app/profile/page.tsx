"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  Lock,
  LogOut,
  AlertTriangle,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import GradientBlobs from "@/components/ui/GradientBlobs";

interface UserProfile {
  user_id: number;
  name: string;
  email: string;
  role: string;
  force_password_reset: boolean;
  phone?: string;
  city?: string;
  address_line?: string;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForcedReset = searchParams.get("force_reset") === "true";

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Colombo");
  const [addressLine, setAddressLine] = useState("");

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/auth/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name || "");
          setEmail(data.email || "");
          setPhone(data.phone || "");
          setCity(data.city || "Colombo");
          setAddressLine(data.address_line || "");
        } else if (res.status === 401) {
          router.push("/login?redirect=/profile");
        }
      } catch (err) {
        console.error("Failed to load user session", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to update password.");
      }

      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // If user was here for forced reset, remove param and notify
      if (isForcedReset) {
        setTimeout(() => {
          router.push("/profile");
        }, 1500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error changing password.";
      setPwError(msg);
    } finally {
      setPwLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    router.push("/login");
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Forced Password Reset Alert Banner */}
        {(isForcedReset || profile?.force_password_reset) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-5 flex items-start gap-4 text-amber-900 shadow-sm"
          >
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-800 text-base">
                Action Required: First-Time Password Reset
              </h3>
              <p className="text-sm text-amber-700/90 mt-1">
                Security policy requires you to change your temporary password before accessing full dispatch and order management features.
              </p>
            </div>
          </motion.div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-text-heading">
              Account & Profile
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
              Role: {profile?.role || "CUSTOMER"}
            </span>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Manage your credentials, delivery contacts, and account security.
          </p>
        </div>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3 text-green-800 text-sm"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <span>Profile details updated successfully!</span>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="card-glass p-6 rounded-2xl">
              <h2 className="text-lg font-bold text-text-heading mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" /> Merchant Information
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                    Contact / Business Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full rounded-xl border border-border-card bg-slate-100 px-3 py-2 text-sm text-text-muted cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                      Registered Address Line
                    </label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                      Hub City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="md">
                    <Save className="h-4 w-4 mr-1.5" /> Save Profile Details
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Security & Password Reset Box */}
          <div className="space-y-6">
            <div className="card-glass p-6 rounded-2xl border-2 border-green-500/20">
              <h2 className="text-lg font-bold text-text-heading mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Security & Password
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Update your account password or resolve a forced temporary password reset.
              </p>

              {pwSuccess && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              {pwError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{pwError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border-card bg-bg-surface px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-3 text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {pwLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProfileContent />
    </Suspense>
  );
}
