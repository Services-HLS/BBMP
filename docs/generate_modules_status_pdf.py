"""Short PDF: modules Present vs Missing (vs SWM presentation)."""
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

OUT = Path(__file__).with_name("BBMP_Modules_Present_vs_Missing.pdf")

NAVY = colors.HexColor("#10283C")
LEAF = colors.HexColor("#2DBE6A")
LIGHT = colors.HexColor("#F4F7FA")
BORDER = colors.HexColor("#D0D7DE")
MUTED = colors.HexColor("#5B6B7A")
PRESENT_BG = colors.HexColor("#E8F8EF")
MISSING_BG = colors.HexColor("#FDECEC")
PARTIAL_BG = colors.HexColor("#FFF8E8")


def build():
    base = getSampleStyleSheet()
    title = ParagraphStyle(
        "title", parent=base["Title"], fontName="Helvetica-Bold",
        fontSize=16, leading=20, textColor=NAVY, alignment=TA_CENTER, spaceAfter=4,
    )
    sub = ParagraphStyle(
        "sub", parent=base["Normal"], fontName="Helvetica",
        fontSize=9, leading=12, textColor=MUTED, alignment=TA_CENTER, spaceAfter=2,
    )
    h = ParagraphStyle(
        "h", parent=base["Heading1"], fontName="Helvetica-Bold",
        fontSize=11, leading=14, textColor=NAVY, spaceBefore=8, spaceAfter=3,
    )
    cell = ParagraphStyle(
        "cell", parent=base["Normal"], fontName="Helvetica",
        fontSize=8.5, leading=11, textColor=NAVY,
    )
    cell_h = ParagraphStyle(
        "cell_h", parent=base["Normal"], fontName="Helvetica-Bold",
        fontSize=8.5, leading=11, textColor=colors.white,
    )
    note = ParagraphStyle(
        "note", parent=base["Normal"], fontName="Helvetica",
        fontSize=8, leading=10.5, textColor=MUTED, spaceBefore=2, spaceAfter=2,
    )

    def tbl(headers, rows, widths, header_bg=NAVY):
        data = [[Paragraph(x, cell_h) for x in headers]]
        for r in rows:
            data.append([Paragraph(str(c), cell) for c in r])
        t = Table(data, colWidths=widths, repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), header_bg),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
            ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        return t

    def add_hf(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LEAF)
        canvas.setLineWidth(2)
        canvas.line(16 * mm, A4[1] - 12 * mm, A4[0] - 16 * mm, A4[1] - 12 * mm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(16 * mm, A4[1] - 10 * mm, "BBMP One App — Modules Present vs Missing")
        canvas.setStrokeColor(BORDER)
        canvas.setLineWidth(0.5)
        canvas.line(16 * mm, 12 * mm, A4[0] - 16 * mm, 12 * mm)
        canvas.drawCentredString(A4[0] / 2, 7 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=16 * mm, rightMargin=16 * mm,
        topMargin=18 * mm, bottomMargin=16 * mm,
        title="BBMP Modules Present vs Missing",
        author="BBMP One App Documentation",
    )

    story = []
    story.append(Paragraph("BBMP One App", title))
    story.append(Paragraph("Modules Present vs Missing", title))
    story.append(Paragraph(
        "Compared with BBMP_One_App_SWM_Presentation.pdf · Review date: 10 Nov 2026",
        sub,
    ))
    story.append(Paragraph(
        "Short status only — what is in the application and what is not.",
        sub,
    ))
    story.append(Spacer(1, 4))

    # Snapshot
    story.append(Paragraph("1. Snapshot", h))
    story.append(tbl(
        ["Category", "Count", "Meaning"],
        [
            ["Present in application", "14 modules", "Working interactive demo screens / flows"],
            ["Partial in application", "15 modules", "Screen exists, but not full vs presentation"],
            ["Missing from application", "12 modules", "Not built in the app"],
        ],
        [55 * mm, 40 * mm, 75 * mm],
    ))
    story.append(Paragraph(
        "Note: Application is a frontend demo (sample data + localStorage). Not live GPS / BBMP backend.",
        note,
    ))

    # Present
    story.append(Paragraph("2. Present in the Application", h))
    story.append(Paragraph("These modules work as interactive demo flows:", note))
    story.append(tbl(
        ["#", "Module", "Where in app"],
        [
            ["1", "Login (Citizen / Supervisor / Admin)", "/login"],
            ["2", "Citizen — Report a Problem", "/citizen/report"],
            ["3", "Citizen — My Reports", "/citizen/reports"],
            ["4", "Citizen — Today’s Pickup feedback", "/citizen/pickup"],
            ["5", "Citizen — Settings (EN / KN)", "/citizen/settings"],
            ["6", "Ops — Complaint Management", "/complaints"],
            ["7", "Ops — Performance Scorecards (100-point model)", "/scorecards"],
            ["8", "Ops — Score weight / shadow-run settings", "/settings"],
            ["9", "Ops — Sweeping &amp; Black Spots", "/sweeping"],
            ["10", "Ops — Citizen Feedback register", "/feedback"],
            ["11", "Ops — Notifications", "/notifications"],
            ["12", "Ops — Monthly Reports (CSV / print)", "/reports"],
            ["13", "Demo data reset / restore", "/settings"],
            ["14", "App shell / role-based navigation", "AppShell + routes"],
        ],
        [12 * mm, 95 * mm, 63 * mm],
        header_bg=colors.HexColor("#1B7A4A"),
    ))

    # Partial (brief — user asked present vs missing; partial is useful as middle)
    story.append(Paragraph("3. Partial in the Application (screen exists, incomplete vs PDF)", h))
    story.append(tbl(
        ["#", "Module", "Gap in short"],
        [
            ["1", "Dashboard / Central Command view", "One dashboard with filters, not full Command stack"],
            ["2", "Live Vehicle Tracking", "Map UI yes; GPS is simulated"],
            ["3", "Routes &amp; Blocks", "UI yes; no driver mapping app"],
            ["4", "Household Coverage", "Small sample; manual mark, not auto GPS verify"],
            ["5", "Dry Waste Centres", "UI yes; no real geofence"],
            ["6", "Dashcam &amp; AI Events", "Review UI yes; no real AI video"],
            ["7", "Citizen — Track My Auto", "UI yes; location simulated"],
            ["8", "Citizen — My Block", "Display only"],
            ["9", "Arrival alerts", "Toggle only; no real push"],
            ["10", "SLA escalation hierarchy", "Escalate note only; no AGM/Command roles"],
            ["11", "Payment bands", "Shown; payment not linked"],
            ["12", "AI Assistant", "Rule-based demo; no voice / real LLM"],
            ["13", "Impact Dashboard", "Illustrative KPIs"],
            ["14", "Helpdesk intake", "App complaints only"],
            ["15", "Proof of closure", "Photo/evidence partial; no 10 m GPS pin check"],
        ],
        [12 * mm, 70 * mm, 88 * mm],
        header_bg=colors.HexColor("#B7791F"),
    ))

    # Missing
    story.append(Paragraph("4. Missing from the Application", h))
    story.append(Paragraph("These are in the presentation but not built in the app:", note))
    story.append(tbl(
        ["#", "Missing module / capability"],
        [
            ["1", "Real SIM GPS telemetry (position every 10–20 seconds)"],
            ["2", "Device tamper / power-cut / offline alerts"],
            ["3", "Muster check-in app (driver + auto + device issue/return)"],
            ["4", "Muster-app API integration"],
            ["5", "Driver / field staff / block-mapping app"],
            ["6", "Engineering officer role and repair work-order app"],
            ["7", "GPS-pin proof of closure (≤10 m)"],
            ["8", "Next camera-pass re-verify / reopen for potholes"],
            ["9", "Pothole geo-deduplication"],
            ["10", "OTP login (citizen / officers)"],
            ["11", "Dedicated helpdesk staffing / intake channel"],
            ["12", "Monthly 2–5% independent audit workflow for payments"],
        ],
        [12 * mm, 158 * mm],
        header_bg=colors.HexColor("#B42318"),
    ))

    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Source presentation: public/BBMP_One_App_SWM_Presentation.pdf. "
        "Application code was not changed for this document.",
        note,
    ))

    doc.build(story, onFirstPage=add_hf, onLaterPages=add_hf)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build()
