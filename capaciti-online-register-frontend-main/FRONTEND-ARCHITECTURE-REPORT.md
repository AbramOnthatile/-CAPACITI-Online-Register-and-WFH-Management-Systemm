# Frontend Architecture and Naming Report

**Scope:** `capaciti-online-register-frontend` source and configuration, with backend persistence entities checked only to establish cross-layer naming.  
**Snapshot:** 23 October 2026.  
**Purpose:** Baseline for extending a future page/template without introducing another naming or component convention.

## Executive summary

This is a Vite single-page React application with role-based routes for candidates, Tech Champions, and administrators. It has a shared Tailwind design system, a component kit, Recharts wrappers, mock-backed React contexts, and an Axios client prepared for backend integration.

The main consistency concern is that the source currently contains both:

1. **The active route tree:** mostly JavaScript/JSX screens under `src/pages/`, with mock data managed by `AppContext`.
2. **A newer typed feature layer:** TypeScript/TSX screens under `src/features/`, written with typed view data and callbacks, but not mounted by the current router and not connected to API hooks.

There are duplicate and inconsistent frontend model definitions for attendance, users, and WFH requests. The backend also has duplicate enum names across two Java packages. For new template work, use the exact backend/DTO field and enum contract at the integration boundary, then pass one normalized typed view model to the UI. Do not copy the legacy mock field names into a new feature by default.

## Project structure

### Project type and inventory

- **Classification:** Frontend SPA within a full-stack repository.
- **Build/runtime:** Vite; browser entrypoint is `index.html` → `src/main.jsx`.
- **Source inventory:** 85 JS/JSX/TS/TSX files under `src/` (15 `.js`, 41 `.jsx`, 14 `.ts`, 15 `.tsx`).
- **No frontend persistence entities:** persistence models live in the backend; frontend types are UI or API-shaped data contracts.
- **No template-named source module was found under `src/`** at the time of this report.

### Layers and modules

| Location | Responsibility | Current convention |
|---|---|---|
| `src/main.jsx`, `src/App.jsx` | App bootstrap, providers, router composition | JSX |
| `src/routes/` | Authentication and role route guards | JSX |
| `src/layouts/` | Candidate, champion, admin, and shared staff shells | JSX |
| `src/pages/{candidate,champion,admin}/` | Routed role pages | Mostly JSX; default exports |
| `src/pages/staff/` | Staff-shared page components, currently WFH panel | JSX; default export |
| `src/features/candidate/attendance/` | Typed candidate attendance presentation and local feature types | TS/TSX; named exports and prop callbacks |
| `src/features/reports/` | Typed reports presentation model and page | TS/TSX; named exports and data props |
| `src/components/ui/` | Shared typed UI kit and barrel | TSX, exported through `index.ts` |
| `src/components/charts/` | Shared responsive Recharts wrappers | TSX, named exports |
| `src/components/common/` | Earlier reusable JSX components | JSX; overlaps the newer UI kit |
| `src/context/`, `src/hooks/` | Shared state and custom hooks | JSX contexts; one TS hook |
| `src/services/` | Axios client and legacy/mock service helpers | Mostly JS |
| `src/data/` | Local mock/demo records | Mixed JS and TS |
| `src/types/` | Earlier shared frontend model definitions | TS |
| `src/lib/`, `src/styles/` | Status, formatting, count-up, tokens, motion | TS and CSS |

The directory counts below are recursive for each named folder, so a parent total includes its children.

| Source area | Files |
|---|---:|
| `src/app/` | 1 |
| `src/components/` | 16 |
| `src/context/` | 2 |
| `src/data/` | 9 |
| `src/features/` | 8 |
| `src/hooks/` | 1 |
| `src/layouts/` | 5 |
| `src/lib/` | 3 |
| `src/pages/` | 26 |
| `src/routes/` | 3 |
| `src/services/` | 6 |
| `src/styles/` | 2 CSS files |
| `src/types/` | 3 |
| `src/` root | 2 |

### Entry points and routing

- `index.html` declares the root element and loads `/src/main.jsx`.
- `src/main.jsx` imports the three font packages and global styles, then wraps `App` with `BrowserRouter`, `AuthProvider`, and `AppProvider`.
- `src/App.jsx` owns the active React Router route tree.
- `ProtectedRoute` requires an authenticated user; `RoleRoute` checks the role and redirects unauthorized users.
- Routes are grouped beneath role layouts:
  - Candidate: dashboard, attendance, attendance history, WFH list/new/detail, progress, notifications, profile.
  - Champion: dashboard, candidates/list/detail, attendance monitor, WFH list/review, progress review, reports.
  - Admin: dashboard, user management, escalations, audit log, reports.
  - Shared unauthenticated/error routes: login, access denied, catch-all error.
- `src/app/page.tsx` is a separate, unreferenced landing-page prototype; it is not the active root route. The active root route in `App.jsx` redirects to the role dashboard or login.

## Current frontend architecture and data flow

### State and services

- `AuthContext` calls the mock login helper and persists the returned user object in browser local storage under `capaciti-user`.
- `AppContext` initializes users, attendance, WFH requests, progress, notifications, escalations, and audit entries from local mock modules. Current staff actions update this in-memory context; they are not backend mutations.
- `src/services/api.js` creates an Axios instance. Its actual base URL is `VITE_API_BASE_URL` or `http://localhost:8080`; it has a 10-second timeout.
- Several service modules return mock/local data. A source search found the routed UI using `authService` and report helper functions, but no feature API-hook layer or `src/api/` directory.
- `src/features/candidate/attendance/` and `src/features/reports/` receive data and callbacks as props. This is a clean presentation boundary, but those pages are not wired into `src/App.jsx`.

### Shared UI and styling

- Tailwind is **v3**, configured in `tailwind.config.js`; theme colors, fonts, shadows, gradients, and radii reference CSS custom properties.
- `src/styles/tokens.css` is imported by `src/index.css`; `src/styles/motion.css` is imported by `src/main.jsx`.
- Typed UI components are exported through `src/components/ui/index.ts`. The chart kit is in `src/components/charts/index.tsx`.
- Status labels, tones, icons, and chart colors are centralized in `src/lib/status.ts`; date/time helpers are in `src/lib/format.ts`.
- Older `src/components/common/` components and global utility classes in `src/index.css` remain alongside the token-based UI kit. The older styles include hard-coded colors and legacy class names such as `.card`, `.btn`, and `.input`.
- The routed legacy `src/pages/champion/Reports.jsx` still contains inline sample chart values and summary counts; treat it as a legacy demo screen, not a data contract or source of truth for report metrics.
- The template should use the UI/chart barrels, token-based Tailwind theme names, `icons`, `status.ts`, and `format.ts`; avoid introducing a third styling or component convention.

## Entity and model naming

### Backend persistence entities

The following are the actual backend JPA entity class names and table names. These are persistence entities—not evidence that the frontend receives identically shaped JSON DTOs.

| Canonical backend class | Table | Main relationships and model notes |
|---|---|---|
| `User` | `users` | Inherits UUID `id`, `createdAt`, and `updatedAt` from `BaseEntity`; fields include `email`, `firstName`, `lastName`, and `role`. `getFullName()` is derived. User roles distinguish candidate and staff; there is no separate `Candidate` persistence entity in the inspected domain package. |
| `AttendanceRecord` | `attendance_records` | Inherits base fields. Belongs to a `User`; optional link to `WfhRequest`. Uses `attendanceDate`, `workMode`, `clockInAt`, `clockOutAt`, `arrivalStatus`, `departureStatus`, reason/note fields, deliverable link, IP/geolocation verification and measurements, and `aiQualityFlag`. Unique constraint: `(user_id, attendance_date)`. |
| `WfhRequest` | `wfh_requests` | Inherits base fields. Belongs to a requesting `User`; optional `reviewedBy` user. Uses `startDate`, `endDate`, `reason`, JSON `readiness`, `status`, review timestamps/comment, and `aiQualityFlag`. |
| `DailyPrompt` | `daily_prompts` | Inherits base fields. Belongs to a `User`; optional associated `AttendanceRecord`. Uses `promptDate`, `stage`, schedule/expiry timestamps, `status`, JSON `response`, submission timestamp, attempt count, and `aiQualityFlag`. Unique constraint: `(user_id, prompt_date, stage)`. |
| `SupportTicket` | `support_tickets` | Inherits base fields. Belongs to a `User`; optional `resolvedBy` user. Uses `type`, `workMode`, title/description, optional attachment, status, prolonged flag, resolution fields, and `aiQualityFlag`. |
| `AuditLog` | `audit_logs` | Has its own UUID ID and creation timestamp. Optional `actor` user; `action`, target type/ID, and JSON `details`. Does not extend `BaseEntity`. |
| `CampusHub` | `campus_hubs` | Inherits base fields. Uses name, latitude/longitude, `radiusM`, and `whitelistedCidrs`. No JPA relationship to `User` was found on this entity. |
| `QualityAttempt` | `quality_attempts` | Inherits base fields. Belongs to a `User`; uses `contextType`, `contextRef`, attempts, and feedback. Unique constraint: `(user_id, context_type, context_ref)`. |

`BaseEntity` defines UUID `id`, `createdAt`, and `updatedAt`, maintained through JPA lifecycle callbacks. Entity associations inspected are `ManyToOne`; this is an entity-level inventory, not a complete database migration/schema document. Transaction boundaries are backend behavior and are not represented in the frontend.

### Backend enum names and literals

Backend enum literals are serialized-style uppercase `UPPER_SNAKE_CASE`. The API/DTO contract should be verified before converting them to display labels.

| Domain concept | Backend literals |
|---|---|
| Arrival status | `ON_TIME`, `LATE_UNEXCUSED`, `LATE_EXCUSED`, `ABSENT_UNEXCUSED` |
| Departure status | `ON_TIME`, `PARTIAL_DAY`, `LATE_CLOCKOUT` |
| Work mode | `ON_SITE`, `WFH` |
| WFH status | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED` |
| Prompt stage | `MORNING_KICKOFF`, `MIDDAY_PULSE`, `EOD_WRAP_UP` |
| Prompt status | `SCHEDULED`, `ACTIVE`, `SUBMITTED`, `EXPIRED` |
| Ticket status | `OPEN`, `RESOLVED` |
| Ticket type | `BLOCKER`, `IT_ISSUE`, `ACCOUNT`, `HR`, `GENERAL` in `domain.enums` |
| User role | `CANDIDATE`, `TECH_CHAMP`, `ADMIN` |
| Quality context | `PROMPT`, `LATE_REASON`, `EARLY_CLOCKOUT`, `CLOCKOUT_NOTE`, `TICKET`, `WFH_REASON` |

**Backend enum namespace caveat:** there are similarly named enums in both `enums` and `domain.enums`. The inspected entities import `ArrivalStatus`, `DepartureStatus`, `PromptStage`, and `PromptStatus` from `enums`, while `WfhRequest`, `SupportTicket`, and the latter's ticket/work-mode values use `domain.enums`. The duplicate ticket-type definitions differ: `enums.TicketType` has only `IT_ISSUE` and `BLOCKER`, while `domain.enums.TicketType` also has `ACCOUNT`, `HR`, and `GENERAL`. The frontend `ticketType` map currently includes the five-value set. Match any new screen to its actual endpoint DTO, not just a short enum class name.

### Frontend naming drift to account for

| Concept | Current frontend representations | Consistency guidance for a new template |
|---|---|---|
| Attendance record | `src/types/attendance.ts` defines legacy `AttendanceRecord` with `candidateId`, `date`, `status`, and `checkInTime`; `src/features/candidate/attendance/types.ts` defines another `AttendanceRecord` using backend-shaped `userId`, `attendanceDate`, `clockInAt`, `arrivalStatus`, etc. JS mocks use still another shape such as `checkIn`, `checkOut`, and title-case statuses. | Keep the API DTO type distinct from any page/view model. Prefer a single canonical DTO matching the endpoint, then adapt once before rendering. Do not import either `AttendanceRecord` without its module path. |
| Work mode | Legacy type uses `ONSITE`; newer `src/lib/status.ts` uses `ON_SITE`; backend uses `ON_SITE` and `WFH`. | Use the exact API literal at data boundaries; `ON_SITE` is the current backend spelling. Render “On-site” through status metadata. |
| WFH request | Legacy `WfhRequest` uses `candidateId`, `requestDate`, and `supportingInfo`; typed feature uses `userId`, `userName`, `startDate`, `endDate`, reviewer metadata, and quality flag; old mock data often uses `candidate` and `date`. | Name the domain/type `WfhRequest` (PascalCase class/type; camelCase variable) and align fields with the endpoint DTO. Convert legacy shapes in a service/adapter rather than adding `candidate ?? userName` fallbacks to every UI component. |
| User/role | Legacy `User` mock type includes demo-only profile fields and uses lowercase role strings (`candidate`, `tech-champion`, `admin`); backend `UserRole` uses uppercase values (`CANDIDATE`, `TECH_CHAMP`, `ADMIN`). | Keep role literals separate from display labels. Normalize them at the auth/API boundary; don’t assume the backend role string equals the route segment. |
| WFH spelling | Filenames/routes use uppercase `WFH` in places; entity/type/status names use `Wfh`/`wfh`. | Preserve `WFH` in user-facing product copy and established routes; use `WfhRequest`/`wfhStatus` in code identifiers for ordinary PascalCase/camelCase consistency. |
| Mock modules | Both `mockAttendance.js` and `mockAttendance.ts`, and both `mockUsers.js` and `mockUsers.ts`, exist. | Avoid adding parallel duplicate mock sources. Confirm which existing module is authoritative before modifying mock-backed behavior. |

`src/pages/staff/PendingWfhPanel.jsx` is a useful example of the current shared-staff component placement and accessible UI-kit use. It currently bridges two mock request shapes with `userName ?? candidate` and `startDate ?? date`; this is compatibility logic, not a canonical entity contract. A new template should receive one normalized `WfhRequest` view model.

## Naming conventions to retain

- **Backend entity classes:** singular PascalCase nouns (`AttendanceRecord`, `WfhRequest`, `DailyPrompt`); database tables use plural snake_case.
- **Frontend types/interfaces:** PascalCase; avoid defining the same exported type name with different fields in separate modules unless each is explicitly named as a DTO/view model.
- **Variables and properties:** camelCase, including `attendanceDate`, `startDate`, `clockInAt`, and `reviewComment`.
- **Enums/status literals:** uppercase snake case in data contracts; use status metadata for human-readable labels and tones.
- **Components/pages:** PascalCase component names. Legacy page files are commonly PascalCase `.jsx`; typed feature pages and shared design-system components are `.tsx`.
- **Hooks:** `useX` camelCase, e.g. `useCountUp`.
- **Feature folders:** lower-case domain paths under `src/features/<area>/...`.
- **Callbacks:** `on<Action>` props (`onClockIn`, `onSubmitReason`); data-oriented feature pages receive typed data, loading/error states, retry, and callbacks as props.
- **Acronyms:** do not let visual capitalization determine identifier capitalization. Preserve existing public route paths, but name code types consistently (`WfhRequest`, not `WFHRequest`).

## Template-extension guide

When the new template is provided, use this baseline:

1. **Identify its owner and route first.** Active route registration belongs in `src/App.jsx`; do not assume a file under `src/features/` is active.
2. **Use canonical data names.** Follow the endpoint DTO's exact field names and enum values. Keep API DTOs, normalized view models, and persistence entity names conceptually distinct.
3. **Keep mapping out of visual components.** Normalize legacy/backend differences in the data/service boundary; pass one shape into the template.
4. **Reuse the kit.** Import from `src/components/ui` and `src/components/charts`; use `src/components/icons.ts`, `src/lib/status.ts`, and `src/lib/format.ts`.
5. **Keep state ownership explicit.** For a presentational feature page, use typed props and callbacks like the existing typed attendance/report features. If the route remains in the legacy layer, use the existing layout and route guards rather than creating a parallel router.
6. **Preserve screen-state coverage.** Provide loading, empty, and error states; use existing `Skeleton`, `EmptyState`, `ErrorState`, and retry/callback conventions.
7. **Match responsive ownership.** Candidate flows are mobile-first; champion/admin surfaces are desktop-first but responsive. Use the established touch target and motion/accessibility conventions.
8. **Avoid hard-coded tokens or sample records.** Use the token theme and status helpers; keep demo records in mock/data modules, not inside a production screen.
9. **Do not infer missing API fields.** In particular, a frontend mock-only property, display label, or convenience field is not proof that the backend returns it.

## Configuration and source-of-truth gaps

These are current facts that matter before treating this repository as a template source:

- `package.json` declares React 18, React Router 6, Vite 5, Tailwind 3, Recharts 2, Axios, Lucide, and font packages. Installed versions observed in this workspace include React/React DOM 18.3.1, React Router 6.30.6, Vite 5.4.21, Tailwind 3.4.19, Recharts 2.15.4, and Axios 1.20.0. The manifest allows compatible upgrades within its declared ranges.
- TypeScript files exist, but no `tsconfig` or `typecheck` script was found in the frontend root/package scripts. `typescript` was present in the local install as extraneous rather than declared by `package.json`; the Vite build alone should not be treated as a TypeScript type-check.
- The frontend instructions file describes `src/api/types.ts`, API hooks, TanStack Query, and `src/lib/time.ts`, but those paths/dependencies are not present in the current frontend inventory. Current code has `src/services/api.js`, no `src/api/`, and `src/lib/format.ts`.
- `README.md` and `src/services/api.js` give different backend base URL descriptions: the service currently falls back to `http://localhost:8080`, while README describes that value and `copilot-frontend-instructions.md` specifies a `/api/v1` default. Confirm the backend contract before wiring new calls.
- The typed candidate attendance and reports features are not connected to the active router. The old routed pages remain the actual application surfaces until route integration is completed.
- `AppContext` and demo authentication are mock-based. They are appropriate for local UI demonstration, not production data/authentication contracts.
- Backend `SupportTicket` exists, but the frontend's shared app context uses mock escalations rather than a `SupportTicket` collection. Do not equate those two data structures without an explicit mapping.
- Frontend package scripts are `dev`, `build`, and `preview`; no test, lint, or type-check script is declared.

## Source references

- Frontend bootstrap and routes: `src/main.jsx`, `src/App.jsx`, `src/routes/`
- State/services: `src/context/`, `src/services/`, `src/data/`
- Legacy shared models: `src/types/`
- Typed features: `src/features/candidate/attendance/`, `src/features/reports/`
- Shared UI and chart exports: `src/components/ui/index.ts`, `src/components/charts/index.tsx`
- Design tokens and status mappings: `src/styles/tokens.css`, `src/styles/motion.css`, `src/lib/status.ts`, `src/lib/format.ts`
- Backend entity evidence: `../capaciti-online-register-backend/src/main/java/za/ac/capaciti/capacitionlineregisterbackend/domain/`
- Backend enum evidence: `../capaciti-online-register-backend/src/main/java/za/ac/capaciti/capacitionlineregisterbackend/enums/` and `domain/enums/`
