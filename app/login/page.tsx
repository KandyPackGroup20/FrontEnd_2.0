"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Train, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function fillDemoCredentials() {
    setEmail("sunil@kandycargo.lk");
    setPassword("kandypack2026");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Mock login success and redirect
    setSuccess(true);
    setTimeout(() => {
      router.push("/orders");
    }, 1200);
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
          Welcome back
        </h1>
        <p className="mb-6 text-center text-sm text-green-100/80">
          Sign in to manage your shipments
        </p>

        {/* Demo Credentials Helper Card */}
        <div className="mb-6 rounded-2xl bg-white/10 border border-white/15 p-3.5 flex items-center justify-between text-xs backdrop-blur-md">
          <div>
            <div className="font-semibold text-green-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-green-300" /> Demo Credentials
            </div>
            <div className="text-white/70 mt-0.5">sunil@kandycargo.lk • kandypack2026</div>
          </div>
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="rounded-lg bg-green-500/25 hover:bg-green-500/40 text-green-200 border border-green-400/30 px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {success ? (
          <motion.div
            className="rounded-2xl bg-green-900/40 border border-green-400/30 p-6 text-center backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="font-semibold text-green-300 text-lg">Login successful!</p>
            <p className="mt-1 text-sm text-green-100/90">
              Redirecting to your shipments dashboard...
            </p>
            <div className="mt-4">
              <Link href="/orders" className="btn-primary inline-flex text-sm py-2 px-5">
                Go to Orders
              </Link>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-3 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-green-100/90">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-white/15 border border-white/25 px-4 py-3 pl-10 text-sm text-white placeholder-white/50 backdrop-blur-md outline-none transition-all focus:border-green-400 focus:bg-white/20 focus:ring-2 focus:ring-green-400/30"
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            {/* Forgot password */}
            <div className="text-right">
              <Link
                href="#"
                className="text-xs font-medium text-green-300 hover:text-green-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2 shadow-lg shadow-green-950/40 flex items-center justify-center gap-2"
              id="login-submit"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-white/75">
          Do not have an account?{" "}
          <Link href="/register" className="font-semibold text-green-300 hover:text-green-200 transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
