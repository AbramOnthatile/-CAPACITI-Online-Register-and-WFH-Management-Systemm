# CAPACITI Online Register & WFH Management System

CAPACITI is a role-based web application for managing candidate attendance, work-from-home (WFH) requests, progress reviews, notifications, reports, and administrative oversight.

## Product overview

The application provides separate experiences for:

- **Candidates** — record attendance, submit WFH requests, review progress, view notifications, and manage their profile.
- **Tech Champions** — review candidates, monitor attendance, assess WFH requests and progress, and generate reports.
- **Administrators** — manage users, review escalations, inspect audit activity, and access reports.

The frontend talks to the Spring Boot backend at `/api/v1`. Set `VITE_USE_MOCKS=true` to run the frontend alone on mock data.

## Project structure

```text
.
├── capaciti-online-register-backend/        # Java 21, Spring Boot, Maven, Supabase PostgreSQL
└── capaciti-online-register-frontend-main/  # Vite, React, TypeScript
```

## Prerequisites

- Java 21 (point `JAVA_HOME` at a JDK 21 install; newer JDKs are not supported by the build)
- Node.js 18 or newer and npm
- A Supabase PostgreSQL database with the project schema applied

## Backend

First create the tables: run `capaciti-online-register-backend/database/schema.sql` once in the Supabase SQL Editor.

Then copy `capaciti-online-register-backend/.env.example` to `.env` in the same folder and fill it in. The backend reads that file on startup, and it is git-ignored. Use the Supabase **Session pooler** connection details; the direct `db.<project>.supabase.co` host is IPv6-only and fails on most networks. The settings are:

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_DB_URL` | yes | JDBC URL, must start with `jdbc:postgresql://` |
| `SUPABASE_DB_USER` | yes | Database user |
| `SUPABASE_DB_PASSWORD` | yes | Database password |
| `JWT_SECRET` | yes | Token signing key: Base64 of at least 32 random bytes; keep it the same across restarts |
| `JWT_EXPIRATION_MINUTES` | no | Token lifetime, default 60 |
| `CORS_ALLOWED_ORIGINS` | no | Comma-separated frontend origins, default `http://localhost:3000` |
| `GEMINI_API_KEY` | no | AI quality gate; without it text is accepted and flagged |
| `TEAMS_WEBHOOK_URL` | no | Teams alerts for on-site IT issues and prolonged blockers |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | no | Signed URLs for storage attachments |
| `SEED_ENABLED`, `SEED_PASSWORD` | no | `SEED_ENABLED=true` creates the demo campus and users with `SEED_PASSWORD` |
| `APP_TRUSTED_PROXIES` | no | Proxy IPs/CIDRs allowed to set `X-Forwarded-For` |

Then run, from `capaciti-online-register-backend`:

```bash
./mvnw spring-boot:run
```

- Health: http://localhost:8080/actuator/health
- API docs: http://localhost:8080/swagger-ui.html
- Tests: `./mvnw test`

The seeder creates `admin@capaciti.com`, `champ@capaciti.com` and `candidate1@capaciti.com` to `candidate5@capaciti.com`, all with the `SEED_PASSWORD` value, and the campus "CAPACITI Cape Town" with placeholder coordinates. Set the real campus coordinates and whitelisted IPs with `PUT /api/v1/campuses/{id}` before testing on-site clock-in.

## Frontend

From `capaciti-online-register-frontend-main`:

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000. `.env.development` points it at `http://localhost:8080/api/v1` with mocks off.

```bash
npm run dev        # Start the development server
npm run typecheck  # TypeScript check
npm run lint       # ESLint
npm run build      # Production build in dist/
npm run preview    # Preview the production build
```

On the login page the demo account buttons fill in the email; type the demo password to sign in.

## Important notes

- The API token is kept in session storage and cleared on sign-out.
- The routes enforce roles, so a candidate cannot access champion or administrator pages, and the reverse is also restricted.
- Break tracking, profile editing and check-in feedback have no backend endpoint yet and work in mock mode only.
- Never commit real passwords, tokens, or sensitive environment values.
