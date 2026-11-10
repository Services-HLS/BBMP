# BBMP One App — Presentation vs Application Gap Report

**Source document:** `public/BBMP_One_App_SWM_Presentation.pdf` (33 pages, “One App for Bengaluru”, November 2026)  
**Application:** BBMP One App frontend demo (`src/`)  
**Review date:** 10 November 2026  
**Scope:** Comparison only — **no application code was changed** for this report.

---

## 1. Executive summary

The presentation describes a **city-scale production platform**: SIM GPS on 4,994 autos, 238 AI dashcams, muster-app integration, multi-role field apps, SLA escalation to Central Command, GPS-pin proof of closure, performance-linked vendor payment, and a bilingual citizen experience.

The codebase is a **credible interactive frontend demo** of that vision. It implements most **screen-level modules** (ops dashboard, vehicles, routes, coverage, DWC, complaints, sweeping/black spots, dashcam events, scorecards, reports, AI assistant, impact, and a full citizen shell). Almost all behaviour is driven by **`src/services/mockApi.js` + `src/data/seed.js` + `localStorage`**, with **simulated GPS**, **seeded “AI” events**, and a **rule-based** assistant — not live BBMP systems.

| Metric | Value |
|--------|------:|
| Major PDF capabilities inventoried | **48** |
| **PRESENT** (working interactive demo) | **14** (~29%) |
| **PARTIAL** (UI / incomplete vs PDF) | **22** (~46%) |
| **MISSING** | **12** (~25%) |
| **UI surface coverage** (PRESENT + PARTIAL) | **~75%** |
| **Weighted capability score** (PRESENT=1, PARTIAL=0.5) | **~52%** |

**Bottom line:** Strong demo for stakeholder walkthroughs of Part 1 (waste) and Part 2 (roads) *concepts*. Not a production SWM/civic platform; architecture gaps (backend, realtime telemetry, real AI, role hierarchy, proof rules) dominate the MISSING / PARTIAL set.

---

## 2. What the presentation promises (overview)

| Theme (PDF) | Intent |
|-------------|--------|
| **Part 1 — Waste collection** | GPS on every auto; verify every household; DWC visits; daily score → payment bands |
| **Part 2 — Potholes & roads** | AI dashcams find defects; tickets with photo + GPS + SLA; close only with proof |
| **Common platform** | One hierarchy, one issue register, alerts, escalation, citizen + officer apps, Central Command |
| **Scale** | 5 corporations · 198 wards · 4,994 autos/blocks · 238 AI dashcams · 118 DWCs (proposal refs) |

---

## 3. Demo limitations (cross-cutting)

| Limitation | Where it shows up |
|------------|-------------------|
| **localStorage persistence** | `src/utils/storage.js`; `mockApi` persist |
| **No backend / no BBMP APIs** | Entire data plane is `mockApi.js` |
| **Mock / simulated GPS** | `refreshVehicleLocation` random walk; UI warns “not live GPS” |
| **Proposal scale ≠ demo scale** | Seed uses a small subset (e.g. ~8 wards, ~28 autos); `PROPOSAL_SCALE` is reference only |
| **Auth = demo username/password** | `AuthContext` + `DEMO_USERS` — **no OTP** |
| **“AI” = seed + rules** | `aiEvents` fixtures; `askAssistant` keyword rules; dashcam “live-view” is timed simulation |
| **Capacitor packaging only** | Config present; not a store/production mobile pipeline |
| **Shadow-run scoring** | Scores illustrative; payment not executed |
| **SLA / escalation light** | Deadlines + escalate note/priority; no AGM → Corporation → Command automation |
| **Proof of closure weak** | Evidence/photo for some categories; **no ≤10 m GPS pin match / camera re-pass** |

---

## 4. Feature inventory & classification

**Legend**

- **PRESENT** — interactive demo that substantially matches the PDF capability in-app  
- **PARTIAL** — UI/data/demo only, or incomplete vs PDF  
- **MISSING** — not in the application  

### 4.1 Platform & architecture (PDF pp. 2–5, 16)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 1 | One integrated platform (GPS + dashcam + citizen → common issue register) | **PARTIAL** | Shared seed store + IDs; no real ingestion |
| 2 | Field capture: GPS trackers (SIM, multi-GNSS, 10–20 s) | **MISSING** | Simulated coords only |
| 3 | Field capture: AI dashcams (rotated, 4G, blur) | **PARTIAL** | `DashcamPage` + seed events; no hardware/video |
| 4 | Muster app & attendance integration | **MISSING** | Muster entities in seed only; no muster UI |
| 5 | Transmission to central cloud / BBMP systems | **MISSING** | Browser-local only |
| 6 | Central processing & overnight AI analytics | **MISSING** | Pre-seeded detections |

### 4.2 GPS tracker workflow (PDF pp. 6, 21, 24)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 7 | Live map: stops, speed, route adherence | **PARTIAL** | `VehiclesPage`, `RoutesPage`, `MapView` |
| 8 | Houses covered vs normal | **PARTIAL** | `CoveragePage`; manual mark/flag |
| 9 | DWC geofence arrival / dwell / quantity | **PARTIAL** | `DryWasteCentresPage`; manual, not geofenced |
| 10 | Device on / tamper / power-cut alerts | **MISSING** | Not modelled |
| 11 | Alert → act → close with GPS trail or same-spot photo (≤10 m) | **PARTIAL** | Alerts/notifications; no geo proof check |
| 12 | Exception rules with audit reason | **PARTIAL** | Audit log + DWC exceptions; no full matrix |

### 4.3 AI dashcam / pothole workflow (PDF pp. 7, 13, 25)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 13 | Capture video+GNSS; scheduled sync | **MISSING** | Simulated live-view only |
| 14 | AI detect pothole / debris / black spots + severity | **PARTIAL** | Seeded `aiEvents`; review actions on `DashcamPage` |
| 15 | Deduplicate same GPS spot | **MISSING** | No geo-dedup |
| 16 | Ticket to ward Engineering officer + SLA | **PARTIAL** | Assign to supervisors; **no Engineering role** |
| 17 | After-photo only within 10 m of pin | **MISSING** | |
| 18 | Next camera pass re-verify / reopen | **MISSING** | Citizen reopen exists; not camera-driven |
| 19 | Face / plate blur before display | **PARTIAL** | UI copy only |

### 4.4 Applications & dashboards (PDF pp. 8–10)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 20 | Central Command | **PARTIAL** | `DashboardPage` + filters ≈ Command |
| 21 | Corporation dashboard | **PARTIAL** | Same dashboard, corporation filter |
| 22 | Ward console | **PARTIAL** | Ward filter + module pages |
| 23 | Supervisor / JHI field app | **PARTIAL** | Shared ops shell; role `supervisor` |
| 24 | Engineering officer app | **MISSING** | Role not in `ROLES` |
| 25 | Driver / field staff app | **MISSING** | Block-mapping / driver app absent |

### 4.5 Citizen application (PDF pp. 11, 26)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 26 | Track my auto (live, stops away, ETA, KN\|EN) | **PARTIAL** | `TrackAutoPage` — simulated |
| 27 | Arrival alerts 5 / 10 min + delay notices | **PARTIAL** | Prefs only; no real push |
| 28 | Report a problem (+ photo) | **PRESENT** | `ReportProblemPage` |
| 29 | My reports timeline; rate the fix | **PARTIAL** | Timeline + reopen; rating via pickup feedback |
| 30 | My Block | **PARTIAL** | `MyBlockPage` |
| 31 | Today’s pickup daily feedback | **PRESENT** | `TodaysPickupPage` |
| 32 | Settings: language EN/KN, notification toggles | **PRESENT** | `CitizenSettingsPage` |
| 33 | OTP sign-in | **MISSING** | Password demo users |

### 4.6 Helpdesk & grievance (PDF pp. 12–13)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 34 | Intake from app **and** helpdesk | **PARTIAL** | App only |
| 35 | Automatic assignment to ward owners | **PARTIAL** | Mostly manual assign |
| 36 | SLA clocks + escalate AGM / corp / Command | **PARTIAL** | SLA display + escalate to Critical |
| 37 | Closed only with proof; citizen informed | **PARTIAL** | Partial evidence gate; in-app notify |

### 4.7 Performance, payment, audit (PDF p. 14)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 38 | Daily scorecard 100 pts (25/25/20/10/10/5/5) | **PRESENT** | `scoring.js` + `ScorecardsPage` |
| 39 | Payment bands 85–100 / 70–84 / &lt;70 | **PARTIAL** | Displayed; shadow-run; no billing |
| 40 | Camera-day cross-check of houses covered | **MISSING** | |
| 41 | Daily / weekly / monthly audit; 2–5% re-audit | **MISSING** | Demo audit log only |
| 42 | Score correction / dispute with reason | **PRESENT** | `correctScore` |

### 4.8 Waste chain & impact (PDF pp. 22–23, 27)

| # | PDF capability | Status | Notes |
|---|----------------|--------|-------|
| 43 | DWC handover logged per auto/day | **PARTIAL** | Manual handover |
| 44 | Compactor / transfer / plant reconciliation | **PARTIAL** | Seed entities; no reconciliation UI |
| 45 | Impact KPIs (energy, compost, landfill, CO₂e, ₹/t, CSAT, etc.) | **PARTIAL** | `ImpactPage` illustrative; no happiness index |
| 46 | AI Agent: text/voice, KN/EN, role-aware | **PARTIAL** | Rule-based EN assistant; **no voice** |

### 4.9 Ops modules mapped to routes

| Module | Route | Status vs PDF intent |
|--------|-------|----------------------|
| Dashboard | `/dashboard` | PARTIAL (Command/ward/corp collapsed) |
| Live Vehicle Tracking | `/vehicles` | PARTIAL |
| Routes & Blocks | `/routes` | PARTIAL |
| Household Coverage | `/coverage` | PARTIAL |
| Dry Waste Centres | `/dry-waste-centres` | PARTIAL |
| Complaint Management | `/complaints` | PARTIAL → near PRESENT for demo triage |
| Sweeping & Black Spots | `/sweeping` | PARTIAL |
| Dashcam & AI Events | `/dashcam` | PARTIAL |
| Citizen Feedback (ops) | `/feedback` | PRESENT (demo aggregation) |
| Performance Scorecards | `/scorecards` | PRESENT (proposed model) |
| Monthly Reports | `/reports` | PRESENT (client CSV/print) |
| AI Assistant | `/assistant` | PARTIAL |
| Impact Dashboard | `/impact` (admin) | PARTIAL |
| Notifications | `/notifications` | PRESENT (in-app) |
| Settings | `/settings` | PRESENT (demo ops) |
| Citizen Home / Track / Report / Reports / Block / Pickup / Settings | `/citizen/*` | Mix of PRESENT + PARTIAL (see §4.5) |

---

## 5. Present features (working demo)

Usable end-to-end against local seed data:

1. Role-gated login & shells (Citizen / Supervisor / Admin)  
2. Citizen report submission (categories aligned with PDF + photo)  
3. Citizen report history (timeline + reopen)  
4. Today’s pickup feedback  
5. EN / KN labels on primary citizen screens  
6. Ops complaint triage (assign, status, notes, escalate, SLA display)  
7. 100-point daily scoring model matching proposed weights  
8. Scorecards UI + shadow-run + score correction  
9. Configurable score weights in Settings  
10. Black spot / sweeping registers  
11. Ops feedback register  
12. In-app notifications  
13. Reports CSV + print  
14. Demo data reset / restore  

---

## 6. Partial features (UI / incomplete vs PDF)

1. Central / Corporation / Ward Command — one dashboard with filters, not three products  
2. Live vehicle tracking — mock refresh only  
3. Route adherence — not a continuous map-matching engine  
4. Household coverage — small sample; manual verification  
5. DWC visits — no geofence automation  
6. Dashcam AI — review queue + simulated stream; no real CV  
7. Privacy blur — labelled UX only  
8. Citizen track / ETA — fictional coords  
9. Arrival alerts — preference toggles only  
10. My Block — display-focused  
11. Rate-the-fix on ticket — feedback is separate from complaint close  
12. Helpdesk — ops complaints page stands in  
13. SLA hierarchy — no AGM / corp / Command users  
14. Closure with GPS-pin proof — not implemented  
15. Payment bands — shown, not payable  
16. AI Assistant — rules, not LLM/voice/Kannada NLU  
17. Impact — illustrative series  
18. Waste chain beyond DWC — seed only  
19. Muster master data — not operational  
20. City scale — far below proposal numbers  
21. Supervisor scoping — filters, not dedicated field mobile workflow  
22. “Monthly” reports — client aggregation of demo records  

---

## 7. Missing features (not in application)

1. Real SIM GPS / 10–20 s telemetry and fleet hardware integration  
2. Tamper / power-cut / device-offline device alerts  
3. Muster check-in (driver + auto + tracker + dashcam issue/return)  
4. Muster-app API integration  
5. Driver / block-mapping field app  
6. Engineering officer role and work-order lifecycle  
7. GPS-pin-locked proof (≤10 m) and next-pass camera verification  
8. Pothole geo-deduplication / reopen-from-camera  
9. OTP authentication  
10. Dedicated helpdesk channel/staffing UI  
11. Monthly 2–5% independent audit sampling for payment  
12. Production privacy/security stack as described in the proposal (DPDP retention, CV blur pipeline, VAPT, BBMP DC hosting)

Also absent as first-class products: real push notifications, weighbridge tolerances, payment dispute settlement, continuous video storage.

---

## 8. Architecture gaps (PDF four-layer model)

| Layer (PDF) | Gap vs application |
|-------------|--------------------|
| **Field capture** | No GPS devices, dashcams, or muster clients — seed + UI simulation |
| **Transmission** | No SIM/4G ingest, footage sync, or BBMP connectors |
| **Central platform** | No server, DB, queues, object storage, AI inference, geo services |
| **Realtime** | No WebSocket/MQTT; “live” = button-driven simulated location |
| **AI** | No CV model; detections are fixtures; assistant is rule-based |
| **Identity** | Three static demo users; no OTP / SSO / officer directory |
| **Workflow engine** | No timed SLA escalations up the hierarchy |
| **Proof engine** | No geofence radius / EXIF GPS / camera re-pass matcher |
| **Payments** | Score bands only; shadow-run |
| **Scale / HA** | Single-browser localStorage |

---

## 9. Role coverage

| PDF role | App role | Coverage |
|----------|----------|----------|
| Citizen | `citizen` | **Strong demo** |
| Supervisor / JHI | `supervisor` | **Shared ops UI** |
| Ward / Corporation / Central Command | `admin` + filters | **Collapsed into Admin** |
| Engineering officer | — | **Missing** |
| Driver / field worker | — | **Missing** |
| Helpdesk agent | — | **Missing** |
| AGM / Corporation official | — | **Missing** |
| Vendor / contractor portal | — | **Missing** |

Demo users: `citizen` / `supervisor` / `admin` with fixed passwords.

---

## 10. Mapping cheat-sheet (PDF → code)

| PDF concept | Primary code |
|-------------|--------------|
| Central Command / Ward console | `DashboardPage.jsx` |
| Vehicle tracking | `VehiclesPage.jsx`, `mockApi.refreshVehicleLocation` |
| Routes / blocks | `RoutesPage.jsx` |
| Household coverage | `CoveragePage.jsx` |
| DWC handover | `DryWasteCentresPage.jsx` |
| Complaints / helpdesk | `ComplaintsPage.jsx`, `ReportProblemPage.jsx` |
| Dashcam findings | `DashcamPage.jsx`, seed `aiEvents` |
| Score / payment bands | `ScorecardsPage.jsx`, `utils/scoring.js` |
| Citizen flows | `src/pages/citizen/*` |
| AI Agent | `AssistantPage.jsx` |
| Impact | `ImpactPage.jsx` |
| Reports | `ReportsPage.jsx` |
| Data / persistence | `seed.js`, `mockApi.js`, `storage.js` |

---

## 11. Recommendations (prioritized)

### P0 — Clarify demo vs production
1. Keep presentation claims labelled **illustrative / sample**.  
2. Publish demo scale vs proposal scale side-by-side for stakeholders.  
3. Do not imply live GPS, real AI, or live payment linkage.

### P1 — Highest-value gaps for a credible pilot
1. Backend + GPS ingest for pilot wards.  
2. Muster integration (attendance + device issue).  
3. Engineering role + pothole ticket SLA lifecycle.  
4. Proof-at-pin for complaint/AI closure.  
5. Citizen OTP + real arrival notifications.

### P2 — Differentiate Part 2 (roads)
1. Real dashcam upload + AI (or vendor API).  
2. Geo-dedup + next-pass verification.  
3. Face/plate blur pipeline.

### P3 — Governance & payment readiness
1. Owner/SLA matrix with automated escalation.  
2. Dispute workflow before payment band enforcement.  
3. Monthly audit sample workflow (2–5%).  
4. Waste reconciliation (DWC → compactor → plant).

### P4 — Experience polish
1. Split Command / Corporation / Ward shells if hierarchy demos are required.  
2. Driver app for block mapping.  
3. Voice + Kannada for AI Agent; helpdesk queue.  
4. Happiness index + plant telemetry on Impact.

---

## 12. Verdict

The application is a **well-structured product demo** that already surfaces most presentation modules as navigable React pages with interactive sample workflows.

Relative to the PDF’s production claims:

- Roughly **three-quarters** of capabilities appear as **UI surfaces** (PRESENT + PARTIAL).  
- About **half** if PARTIAL items get half credit.  
- Under **one-third** as fully working demo depth (PRESENT).

The decisive gaps are **architecture** (realtime GPS, AI video, muster/backends), **roles** (Engineering, Driver, Helpdesk, Command hierarchy), and **proof/governance rules** (10 m pin, camera re-pass, SLA escalation, payment).

---

*End of report. Application source files were not modified for this analysis.*
