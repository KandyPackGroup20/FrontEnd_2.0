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

## Member: Phase 2 — Rail Capacity Allocation and Spillover (Feature 4.2) — 2026-10-10

Scope: verify and connect the existing Logistics Manager rail screens. `fullworkflow` was initially clean and contained the Phase 1 work. Its entries were preserved. No README or prompt changes, no push/merge/main changes.

### Reused features and fixes

The existing train table/capacity display, create/edit dialogs, pending orders, suitable-trip drawer, auto/manual allocation actions and breakdown screen already call real FastAPI endpoints. They were reused.

- `components/rail/RailManagement.tsx`: removes hardcoded Kandy ID and incorrect destination options (including unsupported cities); loads active hub IDs from `/api/v1/rail/stations`. Schedule input labels explicitly mean Sri Lanka time. Request timestamps include +05:30 rather than depending on the browser's timezone. The backend normalizes them to the existing DATETIME contract.
- A real pending-request dialog appears while allocation executes. A synchronous in-flight guard prevents double submission. No simulated percentage or success timer is used; the existing breakdown appears only from the server's completed allocation response.
- Breakdown labels previously treated every product allocation row as a separate train. They now count distinct trip IDs and use consistent leg numbers. Zero allocation rows are labelled unallocated rather than a single-trip booking. The existing response interface replaces an `any[]` state for this path.
- `lib/rail-input.ts`: tested schedule timestamp, readable validation-error and distinct-trip helpers.
- `tests/rail-input.test.mjs`: regression tests for those actual helpers.
- `workflow-test.md`: this appended member entry.

### Verification

- `node --test tests/rail-input.test.mjs tests/phase1-auth.test.mjs`: **9 passed** (3 rail helpers, 6 existing middleware regressions).
- `npm.cmd run build`: **passed**, including TypeScript and all rail pages. Existing Next.js middleware naming deprecation warning remains.
- ESLint on new helper/test files: **passed**. Full rail-component lint is **not clean**: 10 errors and 6 warnings remain, primarily pre-existing `any`, effect-state and unused-import findings. Linting the checked-in baseline found 11 errors and 7 warnings. No new lint finding was introduced; broad cleanup was kept outside this verification scope.
- The backend suite verifies real allocation writes, multi-trip distribution, rollback, concurrency, migration and station inventory handoff. The frontend tests do not substitute for browser interaction.
- Browser check was retried for this phase and returned `No browser is available`. Visual layout, keyboard/modal interaction and click-through confirmation remain **blocked**, not passed. Existing local services were left alone.

### SQL / integration / remaining checks

No SQL runs from the frontend. Deploy with the matching backend and selected-database `15_phase2_rail_workflow.sql`. Existing versioned API URLs are retained. Keep the Phase 1 proxy, secure-cookie and origin configuration. The pending dialog reports the real HTTP request state; the backend has no streaming sub-step-progress endpoint, so no detailed progress is fabricated.

Before UI approval, use a connected browser to create a schedule with real hub IDs; inspect capacity; allocate a multi-item single-trip order and a multi-trip order; verify distinct-train labels; exercise failure/retry/double-click behavior; and inspect the progress dialog/table on narrow screens. Historical missing manifests and empty/premature receipt policy are documented in the database/backend logs. Dispatch, delivery completion and report correctness remain later workflow responsibilities.

Approval: ready for Phase 2 code review; browser/deployment verification and the pre-existing component lint debt remain explicit limitations.

Phase 2 completion result: **9/9 frontend tests passed**, production build/TypeScript passed, and new-file lint passed. The sibling backend's final **28/28 real MySQL tests passed**. Component lint remains at the documented 10 existing errors/6 warnings; no browser success is claimed. All three branches remain `fullworkflow`; no push or merge.

## Phase 3 member — explicit start, fatigue warnings and available crew (2026-10-10)

Resumed and preserved the interrupted changes. Backend, FrontEnd_2.0 and database remain on `fullworkflow`. No applicable AGENTS.md was found; the archived option3 instructions do not apply. No README, commit, push, merge or main changes.

### Changes and reasons

- `components/roster/LoadingList.tsx`: adds explicit Start delivery for a scheduled run with attached orders. It sends only the start request, prevents duplicate clicks, displays run/order statuses and refreshes loading list and parent demand/schedules. Disables starting an inactive truck or a run with unsaved order selections. Clears stale loading-list data after a successful start and on manual refresh; failures retain actionable messages and retry. Existing attach-whole-orders remains separate.
- `components/roster/AssignmentForm.tsx`: requests eligible crew when route, truck, interval or selected counterpart changes. Aborts obsolete requests and keys results to their inputs so old results cannot enable submission. Removes selections absent from fresh eligibility results and explains why. Shows loading/errors, offers manual availability refresh, and disables selection/submission while results are unavailable. Displays every affected Colombo week's scheduled/proposed hours, limit, remaining hours and projected fatigue badge beside eligible staff.
- `components/roster/WeeklyHours.tsx`, new `components/roster/FatigueBadge.tsx`, new `lib/roster/fatigue.ts`: shared green below 90%, yellow from exactly 90% through exactly 100%, red above 100%. Existing selected-week reporting and driver/assistant limits are unchanged. Projection badges explicitly include the proposed assignment; weekly report badges use scheduled hours.
- `lib/roster/api.ts`: same-origin, no-store client calls to GET `/api/v1/roster/availability` and POST `/api/v1/roster/schedules/{id}/start`, validated response contracts and replay results. Existing create and attach requests are unchanged.
- `tests/roster-api.test.mjs`: new start/availability/rewrite contract checks; component loader resolves the shared badge; rendered weekly warning boundaries verified.
- New `tests/roster-fatigue.test.mjs`: exact driver/assistant warning boundaries, including one second below/above thresholds.
- `workflow-test.md`: this appended record.

Missing functionality was explicit dispatch, interval-filtered crew, and yellow warning thresholds. Existing forms, schedule/loading-list UI, cookie transport, policy and reporting were reused. On resume, clarified availability loading/error/retry handling and removed stale start controls during loading-list refresh.

### Proxy, policy and SQL dependencies

Inspected and tested existing `next.config.ts` rewrite `/api/v1/:path*` → configured backend `/api/v1/:path*`; it covers both new paths with no endpoint allowlist change. Existing middleware matcher excludes `api/`, leaving current database-backed FastAPI authorization intact. Candidate filtering is advisory: the unchanged final backend assignment transaction locks route/truck/crew/history and invokes the same policy again. Original rest rules, exact weekly caps and accepted-only roster audit are preserved. No combined create/attach/start action, inventory deduction or delivery completion was introduced.

No SQL or migration is required for Phase 3. Requires matching backend, existing roster/rail/receipt schema and `ROSTER_DATA_MODE=mysql`. Database repository remains unchanged. Do not initialize/reset an existing database for these changes.

### Actual verification after resume

- `node --test tests/roster-api.test.mjs tests/roster-fatigue.test.mjs`: **47/47 passed**. Includes cookie/error transport, separate start/replay, selected counterpart and cross-week projection contract, rewrite/middleware configuration, rendered weekly badges and exact 40/60-hour boundaries.
- `npx tsc --noEmit`: passed.
- `npx eslint components/roster/AssignmentForm.tsx components/roster/LoadingList.tsx components/roster/WeeklyHours.tsx components/roster/FatigueBadge.tsx lib/roster/api.ts lib/roster/fatigue.ts`: passed. This does not claim the unrelated repository-wide lint debt is fixed.
- `git diff --check`: passed for all three repositories.
- Matching backend: **34/34 real FastAPI/MySQL integration tests** in a newly created disposable schema, plus **11 hours + 5 availability + 17 policy tests**, all passed. Tests cover actual receipt-to-start, separate flow, dispatcher authorization, duplicate/concurrent start, invalid transitions, rollback, unchanged inventory, overlap/rest/cap filtering and cross-week calculations. Existing databases were not reset.

### Remaining checks / review status

The Browser skill returned “No browser is available” and an empty browser list. Therefore no interactive browser or live Next-proxy end-to-end success is claimed. Configuration and client contracts were tested, and UI wiring reviewed; manual browser verification remains for selection clearing after input changes, loading/error/retry behavior, status refresh, double clicks and responsive display. The backend independently verifies all submitted actions. No production build was rerun for Phase 3; TypeScript and scoped lint were run as listed. Ready for code review, with browser verification still required for UI approval. Inventory/delivery-completion workflows belong to later scope.

## Phase 4 member — Station inventory and regional warehouse UI (2026-10-10)

Started from clean `fullworkflow` branches; previous work preserved. No applicable AGENTS.md outside the archived checkout. No README, main, commit, push or merge changes.

### Working features reused and changes

The existing `/warehouse` page already fetched real inventory, manifests, cargo details, bins, adjustment history and Report 6. Reused it and the existing `/api/v1/inventory` contracts instead of creating parallel station pages/endpoints.

- `app/warehouse/page.tsx`: replaces hardcoded station IDs and fake default operator with authenticated profile and authorized `/inventory/stations` choices. No assigned station gives an explicit error. Preserves real role instead of coercing every non-warehouse account to manager. Station changes clear stale data and in-flight station responses cannot overwrite a newer selection. Selector is disabled during mutations.
- Same file: incoming dashboard shows actual allocated cargo units and train status; Confirm Station Intake only enables for nonempty ARRIVED trains. Existing backend revalidates arrival time and receipt eligibility. Immediate duplicate-click guard and post-mutation stock/manifest/report refresh retained.
- Same file: adds product/bin search and native, labelled stock-adjustment dialog with per-product Report damage shortcut. DAMAGED/LOST/EXPIRED presets, negative prefill, existing recount corrections/history and bin controls reused. Adjustment request key remains stable across failures/retries of the same payload and changes when the payload changes. Successful save closes the dialog and refreshes stock/report/history. Server remains authoritative for scope/stock constraints.
- `app/profile/page.tsx`: minimal provisioning integration—SuperAdmin loads real station choices and must select an assigned station when creating warehouse staff. `/admin/users` already reuses this form. No identity workflow redesign.
- `tests/warehouse.test.mjs`: actual component initial-render checks for no fabricated account/station data, labelled search and native damage dialog/reason choices. These do not simulate browser interactions.
- `workflow-test.md`: this record.

### Contracts and initialization

Existing same-origin Next rewrite covers all inventory and auth requests; no proxy change required. Existing singular schema and reason VARCHAR are baseline: prompt plural tables and ENUM names were not duplicated. Project-plan PDF confirms location_id bins and station-level manager scoping. Warehouse staff lacked a mapping; explicit nullable user.station_id was selected based on the plan when the clarification question went unanswered. Unassigned legacy staff require approved assignment; no email/seed guessing.

Deploy matching backend after applying `database/16_phase4_station_workflow.sql` to the selected DB during a station-write pause. No SQL runs from frontend. Existing managers retain station_store.manager_id; legacy warehouse assignments must be populated explicitly. Fresh provisioning uses the station selector. Do not reset an existing DB.

### Actual verification

- `node --test tests/phase1-auth.test.mjs tests/rail-input.test.mjs tests/roster-api.test.mjs tests/roster-fatigue.test.mjs`: **56/56 passed**.
- `node --test tests/warehouse.test.mjs`: **2/2 passed**.
- `npx tsc --noEmit`: passed after final UI edits.
- `node node_modules/eslint/bin/eslint.js app/warehouse/page.tsx app/profile/page.tsx`: zero errors; three existing warehouse warnings (unused getAuthToken and two window.location navigation recommendations). No repository-wide lint cleanup claimed.
- Sibling backend full real-MySQL/FastAPI suite: **43/43 passed**, including nine station tests and 34 earlier lifecycle regressions. Disposable schema only, then cleanup. Covers scope, receipt rollback/concurrency, adjustment idempotency/underflow, real report totals, bin replay and warehouse provisioning. Final SQL null-state refinement has a separate affected-receipt rerun recorded in backend/database logs.
- Migration source consistency and `git diff --check` passed.

### Remaining verification

Browser runtime was checked again and returned `[]`; interactive UI, live proxy, dialog keyboard behavior, mutation/retry/station-switching interactions and narrow-screen layout remain unverified. No production build was run in Phase 4. Ready for code review with these explicit UI/deployment prerequisites, not full-lifecycle approval. Dispatch inventory deduction, delivery completion, barcode/photo package tracking and unrelated reporting redesign were not added.
