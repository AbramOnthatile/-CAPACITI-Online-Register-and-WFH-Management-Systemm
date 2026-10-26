# CAPACITI Online Register & WFH Management System

Role-based frontend for candidate attendance, WFH requests, daily prompt check-ins, support tickets, reports, and administration.

## Setup

Requires Node.js 18 or newer and npm.

```powershell
npm install
npm run dev
```

## API and mock mode

The API base URL defaults to `http://localhost:8080/api/v1`. Copy `.env.example` to `.env.local` to configure the API:

```dotenv
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCKS=true
```

The frontend defaults to demo mode and uses typed sample entities from `src/mocks/entities.ts`. Demo sign-in is available from the account buttons; the demo password is `Password123!`. Demo changes (attendance, breaks, WFH requests and decisions, check-ins, users, support tickets, profile details, notifications, and coach feedback) are saved in browser storage so they remain available after refresh. To connect to the backend, set `VITE_USE_MOCKS=false` and configure the reachable API URL. In API mode, successful authentication stores the JWT and sends it as a bearer token.

Restart the Vite dev server after changing `.env.local`.

## Build

```powershell
npm run build
```

The production build is generated in `dist`.
