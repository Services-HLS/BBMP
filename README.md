# BBMP One App — Smart Solid Waste Management (Frontend Demo)

Polished React frontend prototype for the **BBMP One App** solid waste management proposal. Uses realistic sample data and `localStorage` persistence. **Not** an official BBMP application and **not** connected to live vehicles, citizens, or BBMP APIs.

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

```bash
npm run build    # production build
npm run preview  # preview production build
npm test         # scoring + seed contract tests
```

## Demo login

Sign in with username and password. Expand **Show demo credentials** on the login page, or use:

| Role | Username | Password | Lands on |
|------|----------|----------|----------|
| Citizen | `citizen` | `citizen123` | Citizen Portal |
| Field Supervisor / JHI | `supervisor` | `supervisor123` | Operations Dashboard |
| BBMP Administrator | `admin` | `admin123` | Full admin navigation |

One role per session — logout first to sign in as another role. Session is stored in `localStorage` and survives refresh.

## What’s included

- Role-based demo auth and protected routes
- Admin dashboard with KPIs, charts, alerts, ward comparison
- Live vehicle tracking (illustrative map markers + list)
- Routes & blocks, household coverage, dry-waste centres
- Complaint workflow (citizen submit → ops resolve) with shared state
- Sweeping / black spots, dashcam AI events (demo live-view session)
- Performance scorecards (100-point proposed model, shadow-run)
- Reports with CSV export + print layout
- Rule-based AI assistant over demo data
- Impact / sustainability dashboard (labelled illustrative estimates)
- Notifications centre, settings, reset/restore sample data
- English / Kannada labels on primary citizen screens
- Light / dark theme toggle
- Capacitor-ready config (`capacitor.config.json`)

## Folder structure

```
src/
  app/           # providers, router
  adapters/      # browser vs future Capacitor hooks
  components/    # shared UI, maps, brand, auth
  constants/     # roles, navigation, proposal scale
  context/       # auth, data, notifications, theme
  data/          # deterministic seed generator
  hooks/
  i18n/          # EN/KN dictionary
  layouts/       # AppShell (sidebar / drawer / bottom nav)
  pages/         # feature pages + citizen/
  services/      # mockApi (promise-based, swappable for REST)
  theme/
  utils/         # scoring, csv, storage, dates
```

## Sample data limitations

- Proposal-scale figures (5 corporations, 198 wards, 4,994 autos, 118 DWCs, 16,000 km sweeping) are **reference metrics**.
- The demo loads a smaller consistent subset suitable for filtering, charts, and workflows.
- Map positions are illustrative around Bengaluru.
- Scores, waste quantities, and CO₂e figures are **demonstration / illustrative** only.

## Future Node.js / Express integration

Replace functions in `src/services/mockApi.js` with `fetch` calls to your API. UI and contexts already consume promise-based methods (`getComplaints`, `createComplaint`, etc.). Suggested approach:

1. Keep method names and return shapes.
2. Point `VITE_API_BASE_URL` at the Express server.
3. Move auth from demo username/password to JWT / session cookies.
4. Persist in Postgres/Mongo instead of `localStorage`.

## Capacitor (Android / iOS later)

```bash
npm run build
npx cap add android
npx cap add ios
npx cap sync
```

Do not request camera/location/notification permissions until the user explicitly activates a feature. Platform adapters live in `src/adapters/platform.js`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite development server |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve production build |
| `npm test` | Vitest unit tests |
| `npm run lint` | Oxlint |

## Licence / disclaimer

Frontend prototype for demonstration and product exploration only. Do not present as an officially deployed BBMP system.
