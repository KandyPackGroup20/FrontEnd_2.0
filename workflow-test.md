# Workflow verification log

## Member: Phase 1 — Identity, RBAC and subdomain security — 2026-10-10

Scope: verify and wire login, customer registration, SuperAdmin provisioning and domain/page authorization. Only the supplied Phase 1 prompt was handled. `fullworkflow` was initially clean. No main changes, push, merge, README edit or original-prompt edit.

### Working baseline and changes

The existing login/register forms, profile/password-change UI and SuperAdmin directory/provisioning panel already call the real FastAPI API. These were reused, not replaced with a new UI or mock data. Existing API prefixes and table-derived fields remain authoritative.

- `middleware.ts`, `lib/edge-auth.ts`: middleware previously decoded unsigned JWT claims and only checked `/admin` paths. It now verifies sessions through backend `/api/v1/auth/me` (signature, expiry, current DB account/role); checks the entire admin hostname except static/API handling; renders an HTML 403 for customers; blocks admin registration; protects warehouse and existing role-specific routes; enforces password reset; and fails closed with 503 on backend failure. Session lookups are uncached.
- `app/admin/users/page.tsx`: reuses the existing profile page's SuperAdmin management panel, with a SUPERADMIN page gate. No second implementation or duplicate backend endpoint.
- `app/profile/page.tsx`: removed the fixed temporary password, added required password and delivery license/staff-reference fields, and displays staff-directory loading errors. One documented lint suppression covers the existing asynchronous profile-loading effect; updates happen after the API await.
- `app/login/page.tsx`: detects portal from hostname rather than email suffix, clears legacy browser-readable tokens, rejects unsafe redirect targets, and routes roles/reset-required users to existing pages.
- `lib/api.ts`: uses the existing same-origin `/api/v1` proxy and HttpOnly cookie consistently, without adding stale localStorage Bearer tokens; authorization errors are no longer incorrectly described as warehouse-only.
- `tests/phase1-auth.test.mjs`: exercises the real middleware TypeScript with controlled backend responses (these are unit-test doubles, not UI mock data).
- `workflow-test.md`: this record.

### Tests and results

- `node --test tests/phase1-auth.test.mjs`: **6 passed**. Covers all-path admin hostname protection, customer/admin registration rejection, HTML forbidden screen, forged-token denial, backend failure, role gates, forced reset and SuperAdmin destination.
- `npm.cmd run build`: passed, including `/admin/users` route generation. Next.js reports the existing `middleware` convention is deprecated in favor of `proxy`; no unrelated naming migration was performed.
- TypeScript `tsc --noEmit`: passed after final edits.
- ESLint on all changed frontend source/test files: passed after fixing two reported findings.
- Sibling backend integration suite: **13 real FastAPI/MySQL tests passed**, including session cookies, provisioning, duplicate submissions and customer ownership. See its separate workflow log for exact coverage.
- Browser UI/click-through/responsive visual verification: **blocked**. Browser runtime initialized, but discovery returned no available browser and the troubleshooting discovery list was empty. No browser action or successful visual test is claimed. Existing services on ports 3000/8000 were left untouched; no isolated UI services were started after discovery failed.

### Integration / deployment / remaining issues

Deploy with the corresponding backend fixes and database identity-guard migration. `BACKEND_INTERNAL_URL` (or the existing fallback) must point to the real backend; the same-origin rewrite is reused. Configure backend allowed origins and production HTTPS secure cookies. For local HTTP, explicitly disable Secure cookies only in that local environment. Domain checks use actual hostname; use an admin hostname for admin-domain testing.

No SQL runs from the frontend. The prompt's proposed unversioned API paths conflict with existing `/api/v1/auth/*` contracts, so the working contracts were preserved. The existing `/profile` management panel remains available to SuperAdmin, with `/admin/users` as its requested entry point.

Before final UI/deployment approval, verify in a connected browser on both hostnames: customer registration/login/order ownership, customer 403 on the admin host, unauthenticated redirects, SuperAdmin provisioning and duplicate errors, driver/assistant reference fields, forced password change, logout, narrow-screen form/table layout, and real cookie forwarding through the production proxy. Middleware unit tests are not a substitute for that check.

Rail allocation, warehouse receipt, dispatch/completion and reporting business flows remain with their workflow members. This change checks their identity entry points; it does not certify an end-to-end delivered shipment.

Approval: ready for code review; browser/production-domain verification remains unresolved.
