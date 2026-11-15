# Zambia EQA Platform — Web Client

Front end for the External Quality Assessment (EQA) proficiency-testing platform
operated by the National Health Research and Training Institute (NHRTI) and the
Zambia Ministry of Health. It is the web interface laboratories and scheme
coordinators use to run the proficiency-testing workflow — registration,
enrolment, sample receipt, result entry, monitoring and reports — across the
TB, HIV Viral Load, HIV EID and Bacteriology schemes.

Built with **React 18 + TypeScript**, **Vite**, and **DevExtreme** components.
It talks to the FastAPI backend in the separate `EQA-MOH-API` repository.

---

## Tech stack

- **React 18** + **TypeScript** (with some legacy `.jsx`)
- **Vite 7** build tooling (`@vitejs/plugin-react`)
- **React Router v7** for client-side routing
- **DevExtreme / devextreme-react 23.1** UI components (forms, grids, charts)
- **axios** for API calls, **jwt-decode** for reading the auth token

## Project structure

```
EQA-MOH-UI/
  index.html             Vite entry HTML
  vite.config.js         Vite config
  tsconfig.json          editor TypeScript config (build is Vite, not tsc)
  src/
    main.jsx             app bootstrap
    App.jsx              routes (incl. the EditWithReload route wrapper)
    classes/
      app-info.tsx       app config: API base URLs (from VITE_* env), lists
      assist.tsx         Assist helper: API calls, auth/roles, PT constants
      page-config.tsx    per-page config (titles, permissions)
    auth/                login, signup, set-password
    pages/
      admin/             coordinator/admin screens (pt-cycles, results, catalogue)
      facility/          laboratory screens (result entry, receipts)
      scheme/  report/   scheme + report views
      dashboard.tsx      charts/overview
    components/          shared UI (ast-table, SampleReceipt, ResultFiles,
                         PanelProgress, titlebar, header, footer, …)
    context/             React contexts (AuthContext, ThemeContext, …)
    navigation/          menu / nav definitions
    assets/              static assets
```

API base URLs and feature flags come from build-time **Vite environment
variables** (see [Configuration](#configuration)); nothing is hard-coded to a
machine.

---

## Getting started

### Prerequisites

- Node.js 20.19+ (required by Vite 7)
- npm
- The `EQA-MOH-API` backend running and reachable (default dev: `http://127.0.0.1:8800`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure (optional in dev)

Development defaults are in `.env.development` (API at `http://127.0.0.1:8800`,
dev tools on), so the app runs without extra setup as long as the backend is on
port 8800. To point elsewhere, copy the template and edit it:

```bash
cp .env.example .env.local
```

### 3. Run the dev server

```bash
npm run dev
```

Vite serves the app (default http://localhost:5173) with hot-module reload.

### 4. Build for production

```bash
npm run build      # outputs static files to dist/
npm run preview    # optional: preview the production build locally
```

Serve `dist/` with any static host (see the backend repo's `deploy/` for the
nginx/Caddy setup used in production).

---

## Configuration

Settings are **build-time** Vite variables — they are baked into the bundle by
`npm run build`, so set them *before* building. Every variable must start with
`VITE_`. Keep the trailing slash on the URLs.

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the FastAPI backend (e.g. `https://eqa.ims-zm.online/api/`) |
| `VITE_REPORT_URL` | Reports base URL (same as the API until XtraReports is deployed) |
| `VITE_LOCAL_API_URL` | Optional secondary API base |
| `VITE_ENABLE_DEV_TOOLS` | `"true"` shows admin dev tools (e.g. the PT-cycle phase-jump card); omit/`"false"` to hide |

Env files:

- `.env.development` — committed dev defaults (localhost, dev tools on).
- `.env.example` — template for the server values.
- `.env.production.local` — **git-ignored**; put the real production values here
  before `npm run build` on the server.

`src/vite-env.d.ts` types these variables and `import.meta.env`.

## Authentication

The app signs in against the backend, decodes the returned **JWT** (`jwt-decode`)
to read the user's id, role and scheme scope, and sends it on subsequent
requests. Access to admin vs. laboratory screens is enforced by role both here
and on the backend.

## Type checking

The production build (`vite build`) does **not** run `tsc`, and TypeScript is not
a project dependency (the editor uses its bundled TypeScript). To catch type
regressions, run a one-off check:

```bash
npx -y -p typescript tsc --noEmit -p tsconfig.json
```

The `tsconfig.json` is deliberately permissive so it flags real mistakes
(undefined names, bad imports, wrong DevExtreme prop names) without noise. Keep
it at zero errors.

## Linting

```bash
npm run lint
```

---

## Related

- **`EQA-MOH-API`** — the FastAPI backend this client talks to; see its README
  for the API, workflow and database setup.
