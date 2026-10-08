# CAPACITI Online Register & WFH Management System

CAPACITI is a role-based web application for managing candidate attendance, work-from-home (WFH) requests, progress reviews, notifications, reports, and administrative oversight.

## Product overview

The application provides separate experiences for:

- **Candidates** — record attendance, submit WFH requests, review progress, view notifications, and manage their profile.
- **Tech Champions** — review candidates, monitor attendance, assess WFH requests and progress, and generate reports.
- **Administrators** — manage users, review escalations, inspect audit activity, and access reports.

The current frontend uses mock authentication and mock data. It is suitable for local demonstration and can be connected to a real backend through the configured API client.

## Project structure

```text
.
├── capaciti-online-register-frontend/
│   ├── src/
│   │   ├── components/          # Shared UI components
│   │   ├── context/             # Authentication and application state
│   │   ├── data/                # Mock users and records
│   │   ├── hooks/               # Custom React hooks
│   │   ├── layouts/             # Role-based navigation layouts
│   │   ├── pages/               # Candidate, champion, and admin pages
│   │   ├── routes/              # Protected and role-based routes
│   │   └── services/            # API and business-service helpers
│   ├── public/                 # Static assets
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- A modern browser

## Installation

From the repository root, install the frontend dependencies:

```bash
cd capaciti-online-register-frontend
npm install
```

## Run locally

Start the development server:

```bash
npm run dev
```

Vite will print a local address, usually:

- http://localhost:5173

Open the address in a browser.

## Demo accounts

The application includes mock users. Use any of the following accounts:

| Role | Email | Password |
|---|---|---|
| Candidate | candidate@capaciti.test | Password123! |
| Tech Champion | champion@capaciti.test | Password123! |
| Administrator | admin@capaciti.test | Password123! |

> These credentials are intended only for local demonstration. Do not use them in a production environment.

## Backend connection

The frontend API client uses the following URL by default:

```text
http://localhost:8080
```

You can override it by creating a local environment file:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

The API URL is configured in the frontend service layer. The current login flow uses the mock users in the frontend instead of calling the backend.

## Available scripts

From the frontend directory:

```bash
npm run dev       # Start the development server
npm run build     # Create a production build
npm run preview   # Preview the production build
```

The production build is generated in the frontend's `dist` directory.

## Important notes

- Authentication state is saved in browser local storage.
- The current application uses mock data for users, attendance, WFH requests, progress, notifications, and reports.
- The routes enforce roles, so a candidate cannot access champion or administrator pages, and the reverse is also restricted.
- Replace the mock service implementation with API calls before using the application in production.
- Never commit real passwords, tokens, or sensitive environment values.

## Development workflow

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Sign in with a demo account.
4. Explore the role-specific dashboard.
5. Run `npm run build` before deploying.
