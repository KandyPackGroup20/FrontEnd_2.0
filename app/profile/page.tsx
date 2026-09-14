"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
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
  UserPlus,
  Users,
  KeyRound,
  RefreshCw,
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

interface DirectoryUser {
  user_id: number;
  name: string;
  role: string;
  email: string;
  force_password_reset: boolean;
  is_active: boolean;
  created_at?: string;
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

  // Superadmin: Staff management states
  const [usersList, setUsersList] = useState<DirectoryUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("DISPATCHER");
  const [newStaffPassword, setNewStaffPassword] = useState("password123");
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadProfile = useCallback(async () => {
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

        if (data.role === "SUPERADMIN") {
          loadAllUsers();
        }
      } else if (res.status === 401) {
        router.push("/login?redirect=/profile");
      }
    } catch (err) {
      console.error("Failed to load user session", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function loadAllUsers() {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/v1/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffError("");
    setStaffSuccess("");

    if (!newStaffName || !newStaffEmail || !newStaffRole || !newStaffPassword) {
      setStaffError("Please fill in all employee creation fields.");
      return;
    }

    setStaffLoading(true);

    try {
      const res = await fetch("/api/v1/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStaffName,
          email: newStaffEmail,
          role: newStaffRole,
          password: newStaffPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to create employee account.");
      }

      setStaffSuccess(`Employee account for ${newStaffName} created as ${newStaffRole}!`);
      setNewStaffName("");
      setNewStaffEmail("");
      setNewStaffPassword("password123");
      loadAllUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating staff user.";
      setStaffError(msg);
    } finally {
      setStaffLoading(false);
    }
  }

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

  const isSuperadmin = profile?.role === "SUPERADMIN";

  return (
    <div className="relative min-h-screen pb-20 pt-8 px-4 sm:px-6 lg:px-8">
      <GradientBlobs />

      {/* Top Bar */}
      <div className="mx-auto max-w-5xl mb-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-text-heading no-underline group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-white shadow-md shadow-green-600/20 group-hover:scale-105 transition-transform">
            <Train className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kandypack</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="text-sm font-semibold text-text-muted hover:text-green-700 transition-colors"
          >
            Shipments
          </Link>
          <Button variant="primary" size="sm" href="/order/new">
            Book Shipment
          </Button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200/80 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Forced Password Reset Alert Banner */}
        {(isForcedReset || profile?.force_password_reset) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl bg-amber-50 border border-amber-300/80 p-5 flex items-start gap-4 text-amber-950 shadow-sm"
          >
            <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-base">
                Action Required: First-Time Password Reset
              </h3>
              <p className="text-sm text-amber-800/90 mt-1">
                Security policy requires you to change your temporary password before accessing full dispatch operations.
              </p>
            </div>
          </motion.div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-text-heading">
                {isSuperadmin ? "Superadmin Console" : "Account & Profile"}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border shadow-xs ${
                isSuperadmin 
                  ? "bg-green-800 text-white border-green-900" 
                  : profile?.role === "CUSTOMER"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-300"
              }`}>
                {profile?.role || "CUSTOMER"}
              </span>
            </div>
            <p className="text-sm text-text-muted mt-1">
              {isSuperadmin 
                ? "Manage internal staff roles, employee credentials, and system-wide security policies."
                : "Manage your credentials, delivery contacts, and account security."}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUPERADMIN EXCLUSIVE PANEL: LIGHT GREEN GLASS THEME */}
        {/* ========================================================================= */}
        {isSuperadmin && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 space-y-6 rounded-3xl card-glass p-6 sm:p-8 shadow-glass border border-white/70"
          >
            <div className="flex items-center justify-between border-b border-green-900/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white shadow-md shadow-green-600/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-text-heading">
                    Employee & RBAC Access Control
                  </h2>
                  <p className="text-xs text-text-muted">
                    Create new staff accounts with automatic security trigger enforcement (@kandypack.lk).
                  </p>
                </div>
              </div>
            </div>

            {/* Create Staff Form */}
            <div className="rounded-2xl bg-white/70 border border-green-200/60 p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-800 mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-green-600" /> Add New Staff Member
              </h3>

              {staffSuccess && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-300 p-3 text-xs text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="font-medium">{staffSuccess}</span>
                </div>
              )}

              {staffError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div>
                  <label className="block text-xs font-semibold text-text-heading mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full rounded-xl bg-white border border-green-200/80 px-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-heading mb-1">
                    Official Email <span className="text-green-600">(@kandypack.lk)</span>
                  </label>
                  <input
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="e.g. kasun@kandypack.lk"
                    className="w-full rounded-xl bg-white border border-green-200/80 px-3 py-2 text-xs text-text-heading placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-heading mb-1">
                    Assign Job Role
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full rounded-xl bg-white border border-green-200/80 px-3 py-2 text-xs text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                  >
                    <option value="DISPATCHER">DISPATCHER (Truck Fleet & Drivers)</option>
                    <option value="STORE_MGR">STORE_MGR (Station Warehouse)</option>
                    <option value="LOGISTICS_MGR">LOGISTICS_MGR (Rail & Analytics)</option>
                    <option value="WAREHOUSE_STAFF">WAREHOUSE_STAFF (Bin Stock)</option>
                    <option value="DRIVER">DRIVER (Freight Delivery Driver)</option>
                    <option value="ASSISTANT">ASSISTANT (Delivery Assistant)</option>
                    <option value="SUPERADMIN">SUPERADMIN (Master Administrator)</option>
                  </select>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-2.5 px-3 text-xs shadow-md shadow-green-900/10 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {staffLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" /> Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Users Directory Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" /> Active System Users ({usersList.length})
                </h3>
                <button
                  type="button"
                  onClick={loadAllUsers}
                  className="flex items-center gap-1 text-[11px] font-semibold text-green-700 hover:text-green-900 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Refresh
                </button>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-green-200/60 bg-white/80 shadow-xs">
                <table className="w-full text-left text-xs text-text-body">
                  <thead className="bg-green-50/70 text-text-heading font-semibold uppercase text-[10px] tracking-wider border-b border-green-200/60">
                    <tr>
                      <th className="py-2.5 px-4">ID</th>
                      <th className="py-2.5 px-4">Employee Name</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Password Reset</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-100 font-mono">
                    {usersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-text-muted">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-green-600" />
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-text-muted">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.user_id} className="hover:bg-green-50/40 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-green-700">#{u.user_id}</td>
                          <td className="py-2.5 px-4 font-sans font-semibold text-text-heading">{u.name}</td>
                          <td className="py-2.5 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              u.role === "SUPERADMIN"
                                ? "bg-green-800 text-white border-green-900"
                                : u.role === "CUSTOMER"
                                ? "bg-green-50 text-green-800 border-green-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-text-body">{u.email}</td>
                          <td className="py-2.5 px-4 font-sans">
                            {u.force_password_reset ? (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                                <KeyRound className="h-3 w-3 text-amber-600" /> Required
                              </span>
                            ) : (
                              <span className="text-green-700 text-[11px]">Completed</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-sans">
                            <span className="inline-flex items-center gap-1 text-green-700 font-medium text-[11px]">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="md:col-span-2 space-y-6">
            <div className="card-glass p-6 rounded-2xl shadow-glass border border-white/70">
              <h2 className="text-lg font-bold text-text-heading mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" /> Profile & Contact Details
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-text-muted mb-1">
                    Full Name / Business Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
                      className="w-full rounded-xl border border-green-200/40 bg-slate-100/80 px-3 py-2 text-sm text-text-muted cursor-not-allowed shadow-xs"
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
                      className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
                      className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
                      className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
            <div className="card-glass p-6 rounded-2xl shadow-glass border border-white/70">
              <h2 className="text-lg font-bold text-text-heading mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" /> Security & Password
              </h2>
              <p className="text-xs text-text-muted mb-4">
                Update your account password or resolve a forced temporary password reset.
              </p>

              {pwSuccess && (
                <div className="mb-4 rounded-xl bg-green-50 border border-green-300 p-3 text-xs text-green-800 flex items-center gap-2">
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
                    className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
                    className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
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
                    className="w-full rounded-xl border border-green-200/80 bg-white/90 px-3 py-2 text-sm text-text-heading focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 shadow-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-2.5 px-3 text-xs shadow-md shadow-green-900/10 transition-all cursor-pointer disabled:opacity-50"
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
