# CAPACITI Online Register & WFH Management System

This is the React/Vite frontend for the CAPACITI Online Register & WFH Management System.

## Purpose

The frontend provides role-based experiences for:

- **Candidates:** attendance, WFH requests, daily progress, notifications, and profiles.
- **Tech Champions:** candidate reviews, attendance monitoring, WFH reviews, progress reviews, and reports.
- **Administrators:** user management, escalations, audit logs, and reports.

## Technology

- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Lucide React
- Recharts
- Axios

## Prerequisites

- Node.js 18 or newer
- npm

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally http://localhost:5173.

## Demo sign-in

| Role | Email | Password |
|---|---|---|
| Candidate | candidate@capaciti.test | Password123! |
| Tech Champion | champion@capaciti.test | Password123! |
| Administrator | admin@capaciti.test | Password123! |

The login screen is prefilled with the candidate account. The current authentication service uses mock users from the frontend data files.

## Application routes

The protected routes are grouped by role:

- Candidate: `/candidate/dashboard`
- Tech Champion: `/champion/dashboard`
- Administrator: `/admin/dashboard`
- Login: `/login`

The application redirects unauthenticated users to the login page and blocks users from accessing routes outside their assigned role.

## API configuration

The Axios client defaults to:

```text
http://localhost:8080
```

Set an environment variable for a different backend:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

A `.env.local` file can be used during local development. The current mock login flow does not require a running backend, but service modules are prepared for API integration.

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
```

The build is written to the `dist` directory.

## Data and security notes

- Demo accounts and records are stored in frontend source files.
- User sessions are saved in browser local storage.
- Role-based route protection is implemented in the frontend.
- Replace mock authentication and data with secure backend authentication before production deployment.
- Keep real API credentials and secrets out of source control.

## Project files

- `src/App.jsx` — application routes and page composition
- `src/context/AuthContext.jsx` — authentication state and session handling
- `src/services/` — API and business-service helpers
- `src/pages/` — role-specific screens
- `src/data/` — mock records used for local demonstration
