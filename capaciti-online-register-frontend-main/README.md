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

The frontend defaults to demo mode and uses typed sample entities from `src/mocks/entities.ts`. Demo sign-in is available from the account buttons; the demo password is `Password123!`. Demo changes (attendance, breaks, WFH requests and decisions, check-ins, users, support tickets, profile details, notifications, announcements, and coach feedback) are saved in browser storage so they remain available after refresh. Tech Champions can publish announcements to all active candidates; announcements appear only in each candidate's notifications in both demo and API modes. To connect to the backend, set `VITE_USE_MOCKS=false` and configure the reachable API URL. In API mode, successful authentication stores the JWT and sends it as a bearer token.

Restart the Vite dev server after changing `.env.local`.

## Build

```powershell
npm run build
```

The production build is generated in `dist`.

## Deploy to Vercel

Import the repository into Vercel and set **Root Directory** to
`capaciti-online-register-frontend-main`. Vercel can then use the frontend's
`package.json` and `package-lock.json` to install dependencies and build the app.

Use these project settings if Vercel does not detect them automatically:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

The included `vercel.json` rewrites app routes to `index.html`, so refreshing a
page or opening a nested route directly works with React Router.

To connect a deployed app to the backend, add `VITE_API_BASE_URL` as a Vercel
environment variable with the publicly reachable API base URL (for example,
`https://api.example.com/api/v1`), and set `VITE_USE_MOCKS` to `false`. Configure
the backend to allow the deployed Vercel origin through CORS. These `VITE_`
variables are included in the client bundle, so do not put secrets in them.
