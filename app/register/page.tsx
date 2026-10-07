"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, MapPin, Building, ArrowRight, Train, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Colombo");
  const [postalCode, setPostalCode] = useState("00100");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !phone || !addressLine || !city || !password || !confirm) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address_line: addressLine,
          city,
          postal_code: postalCode,
          password,
        }),
      });

      let data: Record<string, unknown> | null = null;
      try {
        data = await res.json();
      } catch {
        // In case proxy returns plain text error
      }

      if (!res.ok) {
        throw new Error((data?.detail as string) || "Registration failed. Please make sure the FastAPI backend is running on port 8000.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/orders");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 sm:px-6 py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/images/hero-static-fallback.png)" }}
    >
      {/* Dark scenic atmospheric overlay */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/75 pointer-events-none" />

      {/* Floating Glass Box */}
      <motion.div
        className="relative z-10 w-full max-w-lg rounded-3xl p-8 md:p-10 backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 text-white"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5 no-underline">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-900/30">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
            Kandypack
          </span>
        </Link>

        <h1
          className="mb-2 text-center text-2xl md:text-3xl font-bold text-white drop-shadow-sm"
          style={{ color: "#FFFFFF" }}
        >
          Create Customer Account
        </h1>
        <p className="mb-6 text-center text-sm text-green-100/80">
          Sign up to manage and track multi-modal freight shipments
        </p>

        {success ? (
          <motion.div
            className="rounded-2xl bg-green-900/40 border border-green-400/30 p-6 text-center backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="font-semibold text-green-300 text-lg">Account created successfully!</p>
            <p className="mt-1 text-sm text-green-100/90">
              Welcome to Kandypack! Redirecting to your dashboard...
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl bg-red-950/60 border border-red-500/30 p-3 text-xs text-red-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Business / Customer Name */}
            <div>
              <label htmlFor="reg-name" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Business / Customer Name
              </label>
              <div className="relative">
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lanka Wholesalers Ltd"
                  className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                  required
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>

            {/* Email & Phone grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-email" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.lk"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-phone" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  Phone
                </label>
                <div className="relative">
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="077 123 4567"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    required
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="reg-address" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  Address Line
                </label>
                <div className="relative">
                  <input
                    id="reg-address"
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    required
                  />
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-city" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  City Hub
                </label>
                <div className="relative">
                  <select
                    id="reg-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm [&>option]:bg-slate-900"
                    required
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Negombo">Negombo</option>
                    <option value="Matara">Matara</option>
                    <option value="Jaffna">Jaffna</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              <div>
                <label htmlFor="reg-confirm" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-semibold py-3 px-4 shadow-lg shadow-green-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-white/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-green-300 hover:text-green-200 transition-colors underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
