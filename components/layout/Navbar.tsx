"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Train, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= 768) setMobileOpen(false);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = [
    { label: "How it Works", href: "#how-it-works" },
    { label: "Coverage", href: "#coverage" },
    { label: "Track Order", href: "/orders" },
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass border-b border-white/20"
            : "bg-transparent"
        }`}
        style={{ borderRadius: scrolled ? 0 : 0 }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <nav
          className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4 md:px-16"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-text-heading no-underline"
            id="nav-logo"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
              <Train className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Kandypack
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="hidden items-center gap-8 md:flex" role="list">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.9375rem] font-medium text-text-body transition-colors hover:text-green-600"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="secondary" size="sm" href="/login" id="nav-sign-in">
              Sign in
            </Button>
            <Button variant="primary" size="sm" href="/register" id="nav-get-started">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-xl md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            id="nav-mobile-toggle"
          >
            {mobileOpen ? (
              <X className="h-5 w-5 text-text-heading" />
            ) : (
              <Menu className="h-5 w-5 text-text-heading" />
            )}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu — glass slide-down sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="glass fixed inset-x-0 top-[72px] z-40 mx-4 flex flex-col gap-2 p-6 md:hidden"
            style={{ borderRadius: 20 }}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-4 py-3 text-[0.9375rem] font-medium text-text-body transition-colors hover:bg-green-50 hover:text-green-600"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-surface-glass-border" />
            <div className="flex flex-col gap-2">
              <Button variant="secondary" href="/login" id="nav-mobile-sign-in">
                Sign in
              </Button>
              <Button variant="primary" href="/register" id="nav-mobile-get-started">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
