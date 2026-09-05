import Link from "next/link";
import { Train, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "How it Works", href: "#how-it-works" },
    { label: "Coverage", href: "#coverage" },
    { label: "Pricing", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Blog", href: "#" },
  ],
  Support: [
    { label: "Help Center", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Privacy Policy", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer
      className="relative mt-auto border-t border-white/20"
      style={{
        background:
          "linear-gradient(180deg, var(--bg-base-alt) 0%, rgba(22,163,74,0.06) 100%)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-16 md:px-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="mb-4 flex items-center gap-2 text-text-heading no-underline"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
                <Train className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Kandypack
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-body">
              Sri Lanka&apos;s first rail + road logistics platform. Ship FMCG
              goods from Kandy to six regional hubs — fast, trackable,
              affordable.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-text-muted">
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Kandy, Sri Lanka
              </span>
              <a
                href="mailto:hello@kandypack.lk"
                className="flex items-center gap-2 text-text-muted hover:text-green-600"
              >
                <Mail className="h-4 w-4" />
                hello@kandypack.lk
              </a>
              <a
                href="tel:+94771234567"
                className="flex items-center gap-2 text-text-muted hover:text-green-600"
              >
                <Phone className="h-4 w-4" />
                +94 77 123 4567
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-heading">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted transition-colors hover:text-green-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row">
          <p className="text-sm text-text-muted">
            &copy; {new Date().getFullYear()} Kandypack. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-green-600"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-green-600"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted transition-colors hover:text-green-600"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
