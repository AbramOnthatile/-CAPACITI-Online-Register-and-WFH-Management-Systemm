Project: CAPACITI Candidate Operations & Attendance Platform (frontend).
Stack: Vite, React, TypeScript, React Router, Tailwind CSS, Lucide React, Recharts, TanStack Query. Folder: capaciti-online-register-frontend.
Backend base URL comes from import.meta.env.VITE_API_BASE_URL (default http://localhost:8080/api/v1). Never hardcode it.

THE BACKEND IS THE SOURCE OF TRUTH
- Only build screens and fields for endpoints that exist. Do not invent fields (no cohort, stream, candidate ID, phone, avatar, notifications, break buttons, feedback comments).
- Types in src/api/types.ts mirror the backend DTOs exactly. Never change them without asking the lead.
- All HTTP goes through src/api/client.ts (Authorization: Bearer token, error envelope {code, message, fieldErrors}). No fetch or axios calls in components.
- No hardcoded sample data in components. Use API hooks. While the backend is unavailable, use typed mocks in src/api/mocks, switched by VITE_USE_MOCKS.

DESIGN SYSTEM (owned by Member A, do not edit)
- Use only design tokens from src/styles/tokens.css and Tailwind theme names. No raw hex colours, no inline font names, no new fonts.
- Use only components from src/components/ui and src/components/charts. If a component is missing, say so and stop.
- Icons only through src/components/icons.ts (Lucide). Status colours and labels only through src/lib/status.ts.
- Fonts: Sora (headings), Figtree (body), IBM Plex Mono (times, numbers in tables).
- Candidate screens are mobile first: design at 360px, then scale up. Touch targets at least 44px. Champion and admin screens are desktop first and responsive.
- Every screen has loading (skeleton), empty and error states.

CODE RULES
- Function components, explicit types, no any. One feature folder per area: features/<area>/{pages,components,hooks}.
- Only edit files in the folder I name. Never edit tokens.css, components/ui, api/client.ts, api/types.ts, router or layouts unless I own them.
- Times shown in Africa/Johannesburg using src/lib/time.ts. Countdowns use serverTime and expiresAt from the API.
- Free-text forms send a draftKey (random string created when the form opens, reused on retry) and show quality.feedbackMessage inline when quality.accepted is false.
- Do not add dependencies. Ask the lead.

MOTION
- Use CSS only (keyframes and transitions in src/styles/motion.css). Do not add animation libraries.
- Durations: 150ms for hover and press, 250ms for enter, 400ms for count-ups and chart draw. One easing: cubic-bezier(0.22, 1, 0.36, 1).
- Animate only transform and opacity. Never animate layout properties.
- Every animation is disabled under @media (prefers-reduced-motion: reduce).
- Motion must carry meaning: pulse means "act now", shake means "failed", check draw means "done". No decorative looping except the clock button idle pulse and live indicators.
- Skeletons shimmer. Lists stagger in by 40ms per item, maximum 8 items.