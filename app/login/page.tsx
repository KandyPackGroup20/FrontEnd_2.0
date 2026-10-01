"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Train, Sparkles, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/orders";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function fillDemoCredentials() {
    setEmail("customer1@gmail.com");
    setPassword("password123");
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          portal_type: "customer",
        }),
      });

      let data: Record<string, unknown> | null = null;
      try {
        data = await res.json();
      } catch {
        // In case proxy returns plain text 500/502
      }

      if (!res.ok) {
        throw new Error((data?.detail as string) || "Login failed. Please verify that your backend server is running.");
      }

      setSuccess(true);
      setTimeout(() => {
        if (data?.role === "SUPERADMIN" || data?.force_password_reset) {
          router.push("/profile");
        } else {
          router.push(redirectTarget);
        }
      }, 800);
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
              <Sparkles className="h-3.5 w-3.5 text-green-300" /> Demo Account
            </div>
            <div className="text-white/70 mt-0.5">customer1@gmail.com • password123</div>
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
            <p className="mt-1 text-sm text-green-100/80">Redirecting to your dashboard...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90"
              >
                Email address
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                  autoComplete="email"
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-green-100/90"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                  autoComplete="current-password"
                  required
                />
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-semibold py-3 px-4 shadow-lg shadow-green-900/40 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-white/70">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-green-300 hover:text-green-200 transition-colors underline underline-offset-4"
          >
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <LoginForm />
    </Suspense>
  );
}
