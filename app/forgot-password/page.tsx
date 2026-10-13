"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Train,
  AlertCircle,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CheckCircle2
} from "lucide-react";

function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "verify" | "done">("request");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [resendNotice, setResendNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResendNotice("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.detail || "Could not dispatch password reset code. Please check your email."
        );
      }

      setStep("verify");
      setResendNotice("A 6-digit reset code was dispatched to your email!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResendNotice("");

    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("Your new password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp_code: otpCode.trim(),
          new_password: newPassword,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "Failed to reset password. Please check your code.");
      }

      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError("");
    setResendNotice("");
    setResending(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.detail || "Could not resend reset code.");
      }

      setResendNotice("A fresh 6-digit code was dispatched to your email!");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResending(false);
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

        {step === "done" ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/20 text-green-400 border border-green-400/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">Password Reset Complete</h1>
            <p className="mb-6 text-sm text-green-100/80">
              Your password has been successfully updated. You can now sign in to your account with your new credentials.
            </p>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-semibold py-3 px-4 shadow-lg shadow-green-900/40 transition-all cursor-pointer no-underline"
            >
              Back to Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : step === "verify" ? (
          <div>
            <h1 className="mb-2 text-center text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
              Enter Reset Code
            </h1>
            <p className="mb-6 text-center text-sm text-green-100/80">
              We sent a 6-digit verification code to <span className="font-semibold text-white">{email}</span>
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
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

              {resendNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5 rounded-xl bg-green-950/60 border border-green-500/30 p-3 text-xs text-green-200"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-green-400 mt-0.5" />
                  <span>{resendNotice}</span>
                </motion.div>
              )}

              {/* 6-digit OTP Input */}
              <div>
                <label
                  htmlFor="reset-otp-input"
                  className="block mb-2 text-xs font-semibold uppercase tracking-wider text-green-100/90 text-center"
                >
                  6-Digit Verification Code
                </label>
                <input
                  id="reset-otp-input"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl bg-white/10 border border-white/20 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="new-password-input"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    autoComplete="new-password"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password-input"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    autoComplete="new-password"
                    required
                  />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otpCode.length < 6 || !newPassword}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-semibold py-3 px-4 shadow-lg shadow-green-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  <>
                    Set New Password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Secondary options */}
              <div className="flex items-center justify-between pt-2 text-xs text-green-100/80">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                  <span>Resend Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("request");
                    setOtpCode("");
                    setError("");
                    setResendNotice("");
                  }}
                  className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Use different email</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <h1 className="mb-2 text-center text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
              Forgot Password
            </h1>
            <p className="mb-6 text-center text-sm text-green-100/80">
              Enter your account email to receive a 6-digit password reset code.
            </p>

            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
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

              {/* Email Input */}
              <div>
                <label
                  htmlFor="forgot-email-input"
                  className="block mb-1 text-xs font-semibold uppercase tracking-wider text-green-100/90"
                >
                  Registered Email
                </label>
                <div className="relative">
                  <input
                    id="forgot-email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-xl bg-white/10 border border-white/20 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 transition-all backdrop-blur-sm"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-semibold py-3 px-4 shadow-lg shadow-green-900/40 transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send Reset Code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-white/70">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-green-300 hover:text-green-200 transition-colors underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
