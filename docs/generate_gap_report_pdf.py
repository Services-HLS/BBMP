"""Generate a clean continuous PDF gap report (no app changes)."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).with_name("BSWML_Presentation_vs_App_Gap_Report.pdf")

NAVY = colors.HexColor("#10283C")
LEAF = colors.HexColor("#2DBE6A")
LIGHT = colors.HexColor("#F4F7FA")
BORDER = colors.HexColor("#D0D7DE")
MUTED = colors.HexColor("#5B6B7A")
PRESENT = colors.HexColor("#1B7A4A")
PARTIAL = colors.HexColor("#B7791F")
MISSING = colors.HexColor("#B42318")


def styles():
    base = getSampleStyleSheet()
    s = {
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=NAVY,
            alignment=TA_CENTER,
            spaceAfter=6,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=MUTED,
            alignment=TA_CENTER,
            spaceAfter=3,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=4,
            borderPadding=0,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=NAVY,
            spaceBefore=7,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=NAVY,
            alignment=TA_JUSTIFY,
            spaceBefore=0,
            spaceAfter=3,
        ),
        "meta": ParagraphStyle(
            "meta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=MUTED,
            spaceAfter=2,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=11.5,
            textColor=NAVY,
            spaceBefore=0,
            spaceAfter=1,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9.5,
            textColor=NAVY,
        ),
        "cell_h": ParagraphStyle(
            "cell_h",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.white,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "status_p": ParagraphStyle(
            "status_p", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.5, leading=9.5, textColor=PRESENT,
        ),
        "status_a": ParagraphStyle(
            "status_a", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.5, leading=9.5, textColor=PARTIAL,
        ),
        "status_m": ParagraphStyle(
            "status_m", parent=base["Normal"], fontName="Helvetica-Bold",
            fontSize=7.5, leading=9.5, textColor=MISSING,
        ),
    }
    return s


def status_para(label, s):
    key = {"PRESENT": "status_p", "PARTIAL": "status_a", "MISSING": "status_m"}[label]
    return Paragraph(label, s[key])


def table(headers, rows, col_widths, s):
    data = [[Paragraph(h, s["cell_h"]) for h in headers]]
    for row in rows:
        cells = []
        for i, val in enumerate(row):
            if i == 2 and val in ("PRESENT", "PARTIAL", "MISSING"):
                cells.append(status_para(val, s))
            else:
                cells.append(Paragraph(str(val), s["cell"]))
        data.append(cells)

    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return t


def bullets(items, s):
    return ListFlowable(
        [ListItem(Paragraph(i, s["bullet"]), leftIndent=8, bulletColor=LEAF) for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=12,
        bulletFontSize=8,
        spaceBefore=0,
        spaceAfter=2,
    )


def add_header_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LEAF)
    canvas.setLineWidth(2)
    canvas.line(16 * mm, A4[1] - 12 * mm, A4[0] - 16 * mm, A4[1] - 12 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(16 * mm, A4[1] - 10 * mm, "BSWML One App — Presentation vs Application Gap Report")
    canvas.drawRightString(A4[0] - 16 * mm, A4[1] - 10 * mm, "Documentation")
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
    canvas.drawCentredString(A4[0] / 2, 7 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=18 * mm,
        bottomMargin=16 * mm,
        title="BSWML Presentation vs Application Gap Report",
        author="BSWML One App Documentation",
    )

    story = []

    # Cover / intro (continuous — no big empty gaps)
    story.append(Paragraph("BSWML One App", s["cover_title"]))
    story.append(Paragraph("Presentation vs Application Gap Report", s["cover_title"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Source: public/BSWML_One_App_SWM_Presentation.pdf (33 pages, November 2026)", s["cover_sub"]))
    story.append(Paragraph("Application: BSWML One App frontend demo (React / Vite)", s["cover_sub"]))
    story.append(Paragraph("Review date: 10 November 2026 · Comparison only — application code not modified", s["cover_sub"]))
    story.append(Spacer(1, 6))

    # 1 Executive summary
    story.append(Paragraph("1. Executive Summary", s["h1"]))
    story.append(Paragraph(
        "The presentation describes a city-scale production platform: SIM GPS on 4,994 autos, "
        "238 AI dashcams, muster-app integration, multi-role field apps, SLA escalation to Central "
        "Command, GPS-pin proof of closure, performance-linked vendor payment, and a bilingual "
        "citizen experience.",
        s["body"],
    ))
    story.append(Paragraph(
        "The codebase is a credible interactive frontend demo of that vision. It implements most "
        "screen-level modules (ops dashboard, vehicles, routes, coverage, DWC, complaints, sweeping/"
        "black spots, dashcam events, scorecards, reports, AI assistant, impact, and a full citizen "
        "shell). Behaviour is driven by mockApi.js + seed.js + localStorage, with simulated GPS, "
        "seeded AI events, and a rule-based assistant — not live BSWML systems.",
        s["body"],
    ))
    story.append(table(
        ["Metric", "Value"],
        [
            ["Major PDF capabilities inventoried", "48"],
            ["PRESENT (working interactive demo)", "14 (~29%)"],
            ["PARTIAL (UI / incomplete vs PDF)", "22 (~46%)"],
            ["MISSING", "12 (~25%)"],
            ["UI surface coverage (PRESENT + PARTIAL)", "~75%"],
            ["Weighted capability score (PRESENT=1, PARTIAL=0.5)", "~52%"],
        ],
        [120 * mm, 50 * mm],
        s,
    ))
    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "<b>Bottom line:</b> Strong demo for stakeholder walkthroughs of Part 1 (waste) and Part 2 "
        "(roads) concepts. Not a production SWM/civic platform. Architecture gaps (backend, realtime "
        "telemetry, real AI, role hierarchy, proof rules) dominate MISSING / PARTIAL items.",
        s["body"],
    ))

    # 2 Presentation promises
    story.append(Paragraph("2. What the Presentation Promises", s["h1"]))
    story.append(table(
        ["Theme (PDF)", "Intent"],
        [
            ["Part 1 — Waste collection", "GPS on every auto; verify every household; DWC visits; daily score → payment bands"],
            ["Part 2 — Potholes &amp; roads", "AI dashcams find defects; tickets with photo + GPS + SLA; close only with proof"],
            ["Common platform", "One hierarchy, one issue register, alerts, escalation, citizen + officer apps, Central Command"],
            ["Scale (proposal refs)", "5 corporations · 198 wards · 4,994 autos/blocks · 238 AI dashcams · 118 DWCs"],
        ],
        [45 * mm, 125 * mm],
        s,
    ))

    # 3 Demo limitations
    story.append(Paragraph("3. Demo Limitations (Cross-Cutting)", s["h1"]))
    story.append(table(
        ["Limitation", "Where it shows up"],
        [
            ["localStorage persistence", "src/utils/storage.js; mockApi persist"],
            ["No backend / no BSWML APIs", "Entire data plane is mockApi.js"],
            ["Mock / simulated GPS", "refreshVehicleLocation random walk; UI warns not live GPS"],
            ["Proposal scale ≠ demo scale", "Seed uses small subset (~8 wards, ~28 autos); PROPOSAL_SCALE is reference only"],
            ["Auth = demo username/password", "AuthContext + DEMO_USERS — no OTP"],
            ["AI = seed + rules", "aiEvents fixtures; askAssistant keyword rules; dashcam live-view is simulation"],
            ["Capacitor packaging only", "Config present; not a store/production mobile pipeline"],
            ["Shadow-run scoring", "Scores illustrative; payment not executed"],
            ["SLA / escalation light", "Deadlines + escalate note; no AGM → Corporation → Command automation"],
            ["Proof of closure weak", "Evidence/photo for some categories; no ≤10 m GPS pin / camera re-pass"],
        ],
        [55 * mm, 115 * mm],
        s,
    ))

    # 4 Feature inventory
    story.append(Paragraph("4. Feature Inventory &amp; Classification", s["h1"]))
    story.append(Paragraph(
        "<b>Legend:</b> PRESENT = interactive demo matching PDF · PARTIAL = UI/demo incomplete vs PDF · "
        "MISSING = not in the application",
        s["body"],
    ))

    story.append(Paragraph("4.1 Platform &amp; architecture (PDF pp. 2–5, 16)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["1", "One integrated platform (GPS + dashcam + citizen)", "PARTIAL", "Shared seed store; no real ingestion"],
            ["2", "GPS trackers (SIM, multi-GNSS, 10–20 s)", "MISSING", "Simulated coords only"],
            ["3", "AI dashcams (rotated, 4G, blur)", "PARTIAL", "DashcamPage + seed events; no hardware/video"],
            ["4", "Muster app &amp; attendance", "MISSING", "Muster entities in seed only"],
            ["5", "Transmission to cloud / BSWML systems", "MISSING", "Browser-local only"],
            ["6", "Central overnight AI analytics", "MISSING", "Pre-seeded detections"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.2 GPS tracker workflow (PDF pp. 6, 21, 24)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["7", "Live map: stops, speed, route adherence", "PARTIAL", "VehiclesPage, RoutesPage, MapView"],
            ["8", "Houses covered vs normal", "PARTIAL", "CoveragePage; manual mark/flag"],
            ["9", "DWC geofence arrival / dwell / quantity", "PARTIAL", "Manual; not geofenced"],
            ["10", "Device on / tamper / power-cut alerts", "MISSING", "Not modelled"],
            ["11", "Alert close with GPS trail or same-spot photo ≤10 m", "PARTIAL", "Alerts exist; no geo proof"],
            ["12", "Exception rules with audit reason", "PARTIAL", "Audit log + DWC exceptions"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.3 AI dashcam / pothole workflow (PDF pp. 7, 13, 25)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["13", "Capture video+GNSS; scheduled sync", "MISSING", "Simulated live-view only"],
            ["14", "AI detect pothole / debris / black spots", "PARTIAL", "Seeded aiEvents; DashcamPage review"],
            ["15", "Deduplicate same GPS spot", "MISSING", "No geo-dedup"],
            ["16", "Ticket to Engineering officer + SLA", "PARTIAL", "Assign to supervisors; no Engineering role"],
            ["17", "After-photo within 10 m of pin", "MISSING", "—"],
            ["18", "Next camera pass re-verify / reopen", "MISSING", "Citizen reopen not camera-driven"],
            ["19", "Face / plate blur before display", "PARTIAL", "UI copy only"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.4 Applications &amp; dashboards (PDF pp. 8–10)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["20", "Central Command", "PARTIAL", "DashboardPage + filters"],
            ["21", "Corporation dashboard", "PARTIAL", "Same dashboard, corp filter"],
            ["22", "Ward console", "PARTIAL", "Ward filter + module pages"],
            ["23", "Supervisor / JHI field app", "PARTIAL", "Shared ops shell"],
            ["24", "Engineering officer app", "MISSING", "Role not in ROLES"],
            ["25", "Driver / field staff app", "MISSING", "Block-mapping app absent"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.5 Citizen application (PDF pp. 11, 26)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["26", "Track my auto (live, ETA, KN|EN)", "PARTIAL", "TrackAutoPage — simulated"],
            ["27", "Arrival alerts 5 / 10 min", "PARTIAL", "Prefs only; no real push"],
            ["28", "Report a problem (+ photo)", "PRESENT", "ReportProblemPage"],
            ["29", "My reports timeline; rate the fix", "PARTIAL", "Timeline + reopen; rating via pickup"],
            ["30", "My Block", "PARTIAL", "MyBlockPage"],
            ["31", "Today’s pickup daily feedback", "PRESENT", "TodaysPickupPage"],
            ["32", "Settings: EN/KN, notification toggles", "PRESENT", "CitizenSettingsPage"],
            ["33", "OTP sign-in", "MISSING", "Password demo users"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.6 Helpdesk &amp; grievance (PDF pp. 12–13)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["34", "Intake from app and helpdesk", "PARTIAL", "App only"],
            ["35", "Automatic assignment to ward owners", "PARTIAL", "Mostly manual assign"],
            ["36", "SLA + escalate AGM / corp / Command", "PARTIAL", "SLA display + escalate to Critical"],
            ["37", "Closed only with proof; citizen informed", "PARTIAL", "Partial evidence gate"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.7 Performance, payment, audit (PDF p. 14)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["38", "Daily scorecard 100 pts (25/25/20/10/10/5/5)", "PRESENT", "scoring.js + ScorecardsPage"],
            ["39", "Payment bands 85–100 / 70–84 / &lt;70", "PARTIAL", "Displayed; no billing"],
            ["40", "Camera-day cross-check of houses covered", "MISSING", "—"],
            ["41", "Audit rhythm; 2–5% re-audit", "MISSING", "Demo audit log only"],
            ["42", "Score correction / dispute with reason", "PRESENT", "correctScore"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.8 Waste chain &amp; impact (PDF pp. 22–23, 27)", s["h2"]))
    story.append(table(
        ["#", "PDF capability", "Status", "Notes"],
        [
            ["43", "DWC handover logged per auto/day", "PARTIAL", "Manual handover"],
            ["44", "Compactor / transfer / plant reconciliation", "PARTIAL", "Seed entities; no reconciliation UI"],
            ["45", "Impact KPIs (energy, compost, CO₂e, CSAT…)", "PARTIAL", "ImpactPage illustrative"],
            ["46", "AI Agent: text/voice, KN/EN, role-aware", "PARTIAL", "Rule-based EN; no voice"],
        ],
        [10 * mm, 70 * mm, 22 * mm, 68 * mm],
        s,
    ))

    story.append(Paragraph("4.9 Ops modules mapped to routes", s["h2"]))
    story.append(table(
        ["Module", "Route", "Status vs PDF"],
        [
            ["Dashboard", "/dashboard", "PARTIAL"],
            ["Live Vehicle Tracking", "/vehicles", "PARTIAL"],
            ["Routes &amp; Blocks", "/routes", "PARTIAL"],
            ["Household Coverage", "/coverage", "PARTIAL"],
            ["Dry Waste Centres", "/dry-waste-centres", "PARTIAL"],
            ["Complaint Management", "/complaints", "PARTIAL"],
            ["Sweeping &amp; Black Spots", "/sweeping", "PARTIAL"],
            ["Dashcam &amp; AI Events", "/dashcam", "PARTIAL"],
            ["Citizen Feedback (ops)", "/feedback", "PRESENT"],
            ["Performance Scorecards", "/scorecards", "PRESENT"],
            ["Monthly Reports", "/reports", "PRESENT"],
            ["AI Assistant", "/assistant", "PARTIAL"],
            ["Impact Dashboard", "/impact", "PARTIAL"],
            ["Notifications", "/notifications", "PRESENT"],
            ["Settings", "/settings", "PRESENT"],
        ],
        [60 * mm, 55 * mm, 55 * mm],
        s,
    ))

    # 5 Present
    story.append(Paragraph("5. Present Features (Working Demo)", s["h1"]))
    story.append(Paragraph("Usable end-to-end against local seed data:", s["body"]))
    story.append(bullets([
        "Role-gated login &amp; shells (Citizen / Supervisor / Admin)",
        "Citizen report submission (categories aligned with PDF + photo)",
        "Citizen report history (timeline + reopen)",
        "Today’s pickup feedback",
        "EN / KN labels on primary citizen screens",
        "Ops complaint triage (assign, status, notes, escalate, SLA display)",
        "100-point daily scoring model matching proposed weights",
        "Scorecards UI + shadow-run + score correction",
        "Configurable score weights in Settings",
        "Black spot / sweeping registers",
        "Ops feedback register",
        "In-app notifications",
        "Reports CSV + print",
        "Demo data reset / restore",
    ], s))

    # 6 Partial
    story.append(Paragraph("6. Partial Features (UI / Incomplete vs PDF)", s["h1"]))
    story.append(bullets([
        "Central / Corporation / Ward Command — one dashboard with filters, not three products",
        "Live vehicle tracking — mock refresh only",
        "Route adherence — not a continuous map-matching engine",
        "Household coverage — small sample; manual verification",
        "DWC visits — no geofence automation",
        "Dashcam AI — review queue + simulated stream; no real CV",
        "Privacy blur — labelled UX only",
        "Citizen track / ETA — fictional coords",
        "Arrival alerts — preference toggles only",
        "My Block — display-focused",
        "Rate-the-fix on ticket — feedback separate from complaint close",
        "Helpdesk — ops complaints page stands in",
        "SLA hierarchy — no AGM / corp / Command users",
        "Closure with GPS-pin proof — not implemented",
        "Payment bands — shown, not payable",
        "AI Assistant — rules, not LLM/voice/Kannada NLU",
        "Impact — illustrative series",
        "Waste chain beyond DWC — seed only",
        "Muster master data — not operational",
        "City scale — far below proposal numbers",
        "Supervisor scoping — filters, not dedicated field mobile workflow",
        "Monthly reports — client aggregation of demo records",
    ], s))

    # 7 Missing
    story.append(Paragraph("7. Missing Features (Not in Application)", s["h1"]))
    story.append(bullets([
        "Real SIM GPS / 10–20 s telemetry and fleet hardware integration",
        "Tamper / power-cut / device-offline device alerts",
        "Muster check-in (driver + auto + tracker + dashcam issue/return)",
        "Muster-app API integration",
        "Driver / block-mapping field app",
        "Engineering officer role and work-order lifecycle",
        "GPS-pin-locked proof (≤10 m) and next-pass camera verification",
        "Pothole geo-deduplication / reopen-from-camera",
        "OTP authentication",
        "Dedicated helpdesk channel/staffing UI",
        "Monthly 2–5% independent audit sampling for payment",
        "Production privacy/security stack (DPDP retention, CV blur pipeline, VAPT, BSWML DC hosting)",
        "Also absent: real push notifications, weighbridge tolerances, payment dispute settlement, continuous video storage",
    ], s))

    # 8 Architecture
    story.append(Paragraph("8. Architecture Gaps (PDF Four-Layer Model)", s["h1"]))
    story.append(table(
        ["Layer (PDF)", "Gap vs application"],
        [
            ["Field capture", "No GPS devices, dashcams, or muster clients — seed + UI simulation"],
            ["Transmission", "No SIM/4G ingest, footage sync, or BSWML connectors"],
            ["Central platform", "No server, DB, queues, object storage, AI inference, geo services"],
            ["Realtime", "No WebSocket/MQTT; live = button-driven simulated location"],
            ["AI", "No CV model; detections are fixtures; assistant is rule-based"],
            ["Identity", "Three static demo users; no OTP / SSO / officer directory"],
            ["Workflow engine", "No timed SLA escalations up the hierarchy"],
            ["Proof engine", "No geofence radius / EXIF GPS / camera re-pass matcher"],
            ["Payments", "Score bands only; shadow-run"],
            ["Scale / HA", "Single-browser localStorage"],
        ],
        [40 * mm, 130 * mm],
        s,
    ))

    # 9 Roles
    story.append(Paragraph("9. Role Coverage", s["h1"]))
    story.append(table(
        ["PDF role", "App role", "Coverage"],
        [
            ["Citizen", "citizen", "Strong demo"],
            ["Supervisor / JHI", "supervisor", "Shared ops UI"],
            ["Ward / Corporation / Central Command", "admin + filters", "Collapsed into Admin"],
            ["Engineering officer", "—", "Missing"],
            ["Driver / field worker", "—", "Missing"],
            ["Helpdesk agent", "—", "Missing"],
            ["AGM / Corporation official", "—", "Missing"],
            ["Vendor / contractor portal", "—", "Missing"],
        ],
        [65 * mm, 45 * mm, 60 * mm],
        s,
    ))
    story.append(Paragraph("Demo users: citizen / supervisor / admin with fixed passwords.", s["meta"]))

    # 10 Mapping
    story.append(Paragraph("10. Mapping Cheat-Sheet (PDF → Code)", s["h1"]))
    story.append(table(
        ["PDF concept", "Primary code"],
        [
            ["Central Command / Ward console", "DashboardPage.jsx"],
            ["Vehicle tracking", "VehiclesPage.jsx, mockApi.refreshVehicleLocation"],
            ["Routes / blocks", "RoutesPage.jsx"],
            ["Household coverage", "CoveragePage.jsx"],
            ["DWC handover", "DryWasteCentresPage.jsx"],
            ["Complaints / helpdesk", "ComplaintsPage.jsx, ReportProblemPage.jsx"],
            ["Dashcam findings", "DashcamPage.jsx, seed aiEvents"],
            ["Score / payment bands", "ScorecardsPage.jsx, utils/scoring.js"],
            ["Citizen flows", "src/pages/citizen/*"],
            ["AI Agent", "AssistantPage.jsx"],
            ["Impact", "ImpactPage.jsx"],
            ["Reports", "ReportsPage.jsx"],
            ["Data / persistence", "seed.js, mockApi.js, storage.js"],
        ],
        [70 * mm, 100 * mm],
        s,
    ))

    # 11 Recommendations
    story.append(Paragraph("11. Recommendations (Prioritized)", s["h1"]))
    story.append(Paragraph("P0 — Clarify demo vs production", s["h2"]))
    story.append(bullets([
        "Keep presentation claims labelled illustrative / sample",
        "Publish demo scale vs proposal scale side-by-side for stakeholders",
        "Do not imply live GPS, real AI, or live payment linkage",
    ], s))
    story.append(Paragraph("P1 — Highest-value gaps for a credible pilot", s["h2"]))
    story.append(bullets([
        "Backend + GPS ingest for pilot wards",
        "Muster integration (attendance + device issue)",
        "Engineering role + pothole ticket SLA lifecycle",
        "Proof-at-pin for complaint/AI closure",
        "Citizen OTP + real arrival notifications",
    ], s))
    story.append(Paragraph("P2 — Differentiate Part 2 (roads)", s["h2"]))
    story.append(bullets([
        "Real dashcam upload + AI (or vendor API)",
        "Geo-dedup + next-pass verification",
        "Face/plate blur pipeline",
    ], s))
    story.append(Paragraph("P3 — Governance &amp; payment readiness", s["h2"]))
    story.append(bullets([
        "Owner/SLA matrix with automated escalation",
        "Dispute workflow before payment band enforcement",
        "Monthly audit sample workflow (2–5%)",
        "Waste reconciliation (DWC → compactor → plant)",
    ], s))
    story.append(Paragraph("P4 — Experience polish", s["h2"]))
    story.append(bullets([
        "Split Command / Corporation / Ward shells if hierarchy demos are required",
        "Driver app for block mapping",
        "Voice + Kannada for AI Agent; helpdesk queue",
        "Happiness index + plant telemetry on Impact",
    ], s))

    # 12 Verdict
    story.append(Paragraph("12. Verdict", s["h1"]))
    story.append(Paragraph(
        "The application is a well-structured product demo that already surfaces most presentation "
        "modules as navigable React pages with interactive sample workflows.",
        s["body"],
    ))
    story.append(Paragraph(
        "Relative to the PDF’s production claims: roughly three-quarters of capabilities appear as "
        "UI surfaces (PRESENT + PARTIAL); about half if PARTIAL items get half credit; under "
        "one-third as fully working demo depth (PRESENT).",
        s["body"],
    ))
    story.append(Paragraph(
        "The decisive gaps are architecture (realtime GPS, AI video, muster/backends), roles "
        "(Engineering, Driver, Helpdesk, Command hierarchy), and proof/governance rules "
        "(10 m pin, camera re-pass, SLA escalation, payment).",
        s["body"],
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "End of report. Application source files were not modified for this analysis.",
        s["meta"],
    ))

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
