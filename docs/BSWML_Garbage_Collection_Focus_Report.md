# BSWML One App — Garbage Collection Focus Report

**Source:** `public/BSWML_One_App_SWM_Presentation.pdf` (Part 1 — Waste Collection)  
**Scope:** Garbage collection only — **pothole / road monitoring excluded**  
**Review date:** 10 November 2026  
**Note:** Comparison only. **Application code was not changed.**

---

## 1. Purpose

You want the app to focus on **garbage collection**, not potholes. This report checks:

1. What the presentation requires for **waste / garbage collection**  
2. What is **already in** the application  
3. What you should **add or modify** later (recommendations only)

---

## 2. Presentation — Garbage Collection Scope (Part 1 only)

From the PDF, Part 1 (“Is every house served, on every route?”) covers:

| Theme | Presentation intent |
|-------|---------------------|
| GPS on autos | Live location every 10–20 s; stops, speed, route adherence |
| Household coverage | Houses covered vs normal; verify every stop |
| Dry Waste Centres (DWC) | Auto visits DWC; arrival / handover logged |
| Alerts | Skipped route, delay, odd stop, missed DWC |
| Citizen | Track auto, ETA, report skipped/late/dry-waste/black-spot pickup issues |
| Score & payment | Daily score /100; payment bands (proposed) |
| Muster | Morning muster links driver + auto + tracker |
| Driver / field | Route work, collection recording (field app) |
| Waste chain | Collection → DWC → further plant reconciliation (proposal) |
| Command views | Live view from corporation → ward → auto |

**Excluded from this report (Part 2 / roads):** pothole AI tickets, Engineering officer app, after-photo pin match for road repairs, camera re-pass for potholes.

---

## 3. Already Present in the Application (Garbage Collection)

These modules support garbage collection as a **working demo** (sample data + localStorage):

| # | Module | Route / area | Fit for garbage focus |
|---|--------|--------------|------------------------|
| 1 | Login (Citizen / Supervisor / Admin) | `/login` | Yes |
| 2 | Operations Dashboard (KPIs, alerts, filters) | `/dashboard` | Yes |
| 3 | Live Vehicle Tracking (map + list; simulated GPS) | `/vehicles` | Yes (demo GPS) |
| 4 | Routes & Blocks | `/routes` | Yes |
| 5 | Household Coverage (mark done / missed) | `/coverage` | Yes |
| 6 | Dry Waste Centres (arrival, handover, notes) | `/dry-waste-centres` | Yes |
| 7 | Complaint Management (pickup-related categories) | `/complaints` | Yes |
| 8 | Sweeping & Black Spots (dumping spots register) | `/sweeping` | Yes for dumping spots; also mixed with pothole tab |
| 9 | Citizen Feedback (ops) | `/feedback` | Yes |
| 10 | Performance Scorecards (100-pt waste model) | `/scorecards` | Yes |
| 11 | Monthly Reports (CSV / print) | `/reports` | Yes |
| 12 | AI Assistant (rule-based over demo data) | `/assistant` | Yes (demo) |
| 13 | Impact Dashboard (illustrative SWM outcomes) | `/impact` | Yes (illustrative) |
| 14 | Notifications | `/notifications` | Yes |
| 15 | Settings (score weights, shadow-run, reset data) | `/settings` | Yes |
| 16 | Citizen Home | `/citizen` | Yes |
| 17 | Track My Auto | `/citizen/track` | Yes (simulated) |
| 18 | Report a Problem (skipped / late / dry waste / black spot…) | `/citizen/report` | Yes |
| 19 | My Reports | `/citizen/reports` | Yes |
| 20 | My Block | `/citizen/block` | Yes |
| 21 | Today’s Pickup feedback | `/citizen/pickup` | Yes |
| 22 | Citizen Settings (EN / KN) | `/citizen/settings` | Yes |

**Garbage-related complaint categories already in app:**  
Skipped Household Pickup · Late Auto · Missed Dry Waste Collection · Black Spot / Illegal Dumping · Suggestion  

**Score weights already match waste collection story:**  
stops vs normal, houses covered, DWC visit, route time, speed alerts, stoppages, device uptime.

---

## 4. Partial — Present but Needs Modify (for real garbage focus)

| # | Module | What exists | What to modify later |
|---|--------|-------------|----------------------|
| 1 | Vehicle tracking | Map + simulated refresh | Connect real GPS / 10–20 s pings |
| 2 | Household coverage | Small sample; manual mark | Auto verify from GPS dwell / stop rules |
| 3 | DWC | Manual arrival / handover | Geofence visit + quantity rules |
| 4 | Alerts / SLA | In-app alerts; light escalate | Stronger owner + SLA for missed pickup / missed DWC |
| 5 | Black spots | Register + status | Optional: link “collected or not” to auto visit (today: register only) |
| 6 | Citizen track / ETA / alerts | UI + prefs | Real location + push notifications |
| 7 | Score / payment bands | Shown; shadow-run | Keep as proposed until real payment integration |
| 8 | Dashboard “Command” | One filtered dashboard | Split ward / corporation views if BSWML needs it |
| 9 | Dashcam page | Mostly road AI demo | If GC-only: keep only waste-useful events (route deviation, stoppage, illegal dumping) — hide/retire pothole |
| 10 | Sweeping page | Sweeping + black spots + **pothole/debris tab** | For GC focus: keep sweeping/black spots; drop or hide pothole/debris tab |
| 11 | Complaint categories | Includes **Pothole** / **Debris** | For GC focus: remove or hide those categories from citizen/ops forms |
| 12 | AI event types | Includes **Pothole** / **Debris** | For GC focus: remove or hide those types |

---

## 5. Missing — Need to Add (Garbage Collection vs Presentation)

| # | Capability from presentation | In app today? | Action |
|-------------------------------|---------------|--------|
| 1 | Real SIM GPS telemetry | No | **Add** backend + device ingest |
| 2 | Device tamper / power-cut / offline alerts | No | **Add** |
| 3 | Muster check-in (driver + auto + tracker at 6:30) | No (seed only) | **Add** |
| 4 | Driver / field staff collection app | No | **Add** |
| 5 | OTP login | No | **Add** (if required for citizens/officers) |
| 6 | Dedicated helpdesk intake (beyond app) | No | **Add** if BSWML needs it |
| 7 | Proof rules for missed pickup close (GPS trail / same-spot photo) | Weak | **Add / strengthen** |
| 8 | Camera-day cross-check of houses covered | No | **Add** (optional pilot) |
| 9 | Monthly audit sample for payment (2–5%) | No | **Add** when payment goes live |
| 10 | Full waste reconciliation (DWC → plant) | Seed only | **Add** later |
| 11 | Real push notifications (auto arriving) | Prefs only | **Add** |

---

## 6. What to Exclude for Garbage-Only Focus (already in app)

These are **road / pothole** oriented. For a garbage-collection-only product you would later **hide or remove** (not done in this review):

| Item | Where |
|------|--------|
| Complaint category **Pothole** | `COMPLAINT_CATEGORIES` |
| Complaint category **Debris** (if used as road debris, not dump) | `COMPLAINT_CATEGORIES` |
| AI event type **Pothole** | `AI_EVENT_TYPES` / Dashcam seed |
| Sweeping tab **Civic events (pothole / debris)** | `SweepingPage` |
| Heavy Dashcam “road defect” story | `DashcamPage` (keep only if used for dumping / route / stoppage) |

**Keep for garbage:** Black Spot / Illegal Dumping, skipped/late/dry-waste complaints, sweeping stretches, DWC, coverage, vehicles, routes, scorecards.

---

## 7. Verdict — Do You Need to Add or Modify?

| Question | Answer |
|----------|--------|
| Are core **garbage collection UI modules** there? | **Yes** — tracking, routes, coverage, DWC, complaints, citizen track/report/pickup, scorecards, reports |
| Is it enough for a **demo / proposal walkthrough** of waste collection? | **Yes** |
| Is it enough for **live BSWML garbage operations**? | **No** — still mock GPS, localStorage, no muster/driver backend |
| Must you **add** something for GC focus? | **Yes, for production** — see §5 (GPS, muster, driver app, proof, notifications) |
| Must you **modify** something for GC-only focus? | **Yes, if you want to drop potholes** — see §4 items 9–12 and §6 (hide pothole categories/tabs) |

### Priority if you continue (recommendations only)

1. **Modify (product focus):** Hide/remove pothole & road-debris from complaints, dashcam, sweeping.  
2. **Modify (depth):** Real GPS → coverage & DWC geofence.  
3. **Add:** Muster + driver app.  
4. **Add:** Stronger missed-pickup alerts + proof of close.  
5. **Later:** OTP, helpdesk, payment audit, plant reconciliation.

---

## 8. Short Summary

- **Garbage collection story:** largely **covered as demo screens**.  
- **Pothole story:** present in places but **out of your new focus** — treat as exclude/hide later.  
- **To go from demo → real garbage ops:** add live GPS, muster, driver app, and stronger verification — not more pothole features.

*End of report. No application files were modified.*
