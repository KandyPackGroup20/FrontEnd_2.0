"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, ArrowRight, Train } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !phone || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSuccess(true);
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
        className="relative z-10 w-full max-w-md rounded-3xl p-8 md:p-10 backdrop-blur-2xl bg-white/10 border border-white/20 shadow-[0_16px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 text-white"
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
          Create your account
        </h1>
        <p className="mb-8 text-center text-sm text-green-100/80">
          Start shipping with rail and road logistics
        </p>

        {success ? (
          <motion.div
            className="rounded-2xl bg-green-900/40 border border-green-400/30 p-6 text-center backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="font-semibold text-green-300 text-lg">Account created!</p>
            <p className="mt-1 text-sm text-green-100/90">
              Welcome to Kandypack. You can now book your first freight shipment.
            </p>
            <div className="mt-4">
              <Link href="/order/new" className="btn-primary inline-flex text-sm py-2 px-5">
                Book a Shipment
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="Sunil Perera"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="register-phone" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="+94 77 123 4567"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="register-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-2.5 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-2.5 text-sm text-red-200"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2 shadow-lg shadow-green-950/40 flex items-center justify-center gap-2"
              id="register-submit"
            >
              Create Account
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/75">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-green-300 hover:text-green-200 transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
