"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Lock, ArrowRight, Train } from "lucide-react";
import GradientBlobs from "@/components/ui/GradientBlobs";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

    // Mock login success
    setSuccess(true);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <GradientBlobs />

      <motion.div
        className="glass relative z-10 w-full max-w-md p-8 md:p-10"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 no-underline">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-text-heading">
            Kandypack
          </span>
        </Link>

        <h1 className="mb-2 text-center text-2xl font-bold">Welcome back</h1>
        <p className="mb-8 text-center text-sm text-text-muted">
          Sign in to manage your shipments
        </p>

        {success ? (
          <motion.div
            className="rounded-xl bg-green-50 p-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="font-semibold text-green-700">Login successful!</p>
            <p className="mt-1 text-sm text-green-600">
              Redirecting to your dashboard…
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="input-label">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
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
                className="text-sm font-medium text-green-600 hover:text-green-500"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary w-full" id="login-submit">
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-green-600">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
