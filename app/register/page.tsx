"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Mail, Lock, User, Phone, ArrowRight, Train } from "lucide-react";
import GradientBlobs from "@/components/ui/GradientBlobs";

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

        <h1 className="mb-2 text-center text-2xl font-bold">Create your account</h1>
        <p className="mb-8 text-center text-sm text-text-muted">
          Start shipping with rail + road logistics
        </p>

        {success ? (
          <motion.div
            className="rounded-xl bg-green-50 p-6 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <p className="font-semibold text-green-700">Account created!</p>
            <p className="mt-1 text-sm text-green-600">
              Welcome to Kandypack. Redirecting…
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="input-label">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="John Perera"
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="input-label">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="register-phone" className="input-label">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input pl-10"
                  placeholder="+94 77 123 4567"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="input-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="input-label">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  id="register-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input pl-10"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
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

            {/* Submit */}
            <button type="submit" className="btn-primary w-full" id="register-submit">
              Create account
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-600">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
