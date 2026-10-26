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
VITE_USE_MOCKS=false
```

Set `VITE_USE_MOCKS=true` to use the typed in-memory mock entities in `src/mocks/entities.ts`. The mock-only presentation data is isolated in `src/mocks/demoOnly.ts`. In API mode, successful authentication stores the JWT and sends it as a Bearer token.

## Build

```powershell
npm run build
```

The production build is generated in `dist`.
