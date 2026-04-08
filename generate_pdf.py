#!/usr/bin/env python3
"""Generate LoktantraVani Project Overview PDF"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

# Colors
SAFFRON = HexColor("#FF9933")
DARK = HexColor("#121212")
GRAY = HexColor("#727272")
LIGHT_GRAY = HexColor("#f7f7f5")
RED = HexColor("#dc2626")
GREEN = HexColor("#16a34a")
BLUE = HexColor("#2563eb")

# Styles
styles = {
    "title": ParagraphStyle(
        "Title", fontName="Helvetica-Bold", fontSize=28,
        textColor=DARK, spaceAfter=6, leading=32, alignment=TA_LEFT
    ),
    "subtitle": ParagraphStyle(
        "Subtitle", fontName="Helvetica", fontSize=14,
        textColor=SAFFRON, spaceAfter=20, leading=18, alignment=TA_LEFT
    ),
    "h1": ParagraphStyle(
        "H1", fontName="Helvetica-Bold", fontSize=18,
        textColor=DARK, spaceBefore=20, spaceAfter=10, leading=22
    ),
    "h2": ParagraphStyle(
        "H2", fontName="Helvetica-Bold", fontSize=14,
        textColor=SAFFRON, spaceBefore=16, spaceAfter=8, leading=18
    ),
    "h3": ParagraphStyle(
        "H3", fontName="Helvetica-Bold", fontSize=11,
        textColor=DARK, spaceBefore=10, spaceAfter=4, leading=14
    ),
    "body": ParagraphStyle(
        "Body", fontName="Helvetica", fontSize=10,
        textColor=DARK, spaceAfter=8, leading=14, alignment=TA_JUSTIFY
    ),
    "small": ParagraphStyle(
        "Small", fontName="Helvetica", fontSize=8,
        textColor=GRAY, spaceAfter=4, leading=10
    ),
    "bullet": ParagraphStyle(
        "Bullet", fontName="Helvetica", fontSize=10,
        textColor=DARK, spaceAfter=4, leading=14, leftIndent=20,
        bulletIndent=8, bulletFontName="Helvetica", bulletFontSize=10
    ),
    "label": ParagraphStyle(
        "Label", fontName="Helvetica-Bold", fontSize=8,
        textColor=GRAY, spaceAfter=2, leading=10,
    ),
    "center": ParagraphStyle(
        "Center", fontName="Helvetica", fontSize=10,
        textColor=DARK, alignment=TA_CENTER, leading=14
    ),
    "quote": ParagraphStyle(
        "Quote", fontName="Helvetica-Oblique", fontSize=11,
        textColor=GRAY, spaceAfter=8, leading=15, leftIndent=30,
        rightIndent=30, alignment=TA_CENTER, spaceBefore=8
    ),
}


def header_footer(canvas_obj, doc):
    """Draw header and footer on each page"""
    canvas_obj.saveState()
    w, h = A4

    # Header line
    canvas_obj.setStrokeColor(SAFFRON)
    canvas_obj.setLineWidth(3)
    canvas_obj.line(40, h - 40, w - 40, h - 40)

    # Header text
    canvas_obj.setFont("Helvetica-Bold", 8)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(40, h - 35, "LOKTANTRAVANI")
    canvas_obj.drawRightString(w - 40, h - 35, "PROJECT OVERVIEW 2026")

    # Footer
    canvas_obj.setStrokeColor(HexColor("#dfdfdf"))
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(40, 35, w - 40, 35)
    canvas_obj.setFont("Helvetica", 7)
    canvas_obj.setFillColor(GRAY)
    canvas_obj.drawString(40, 22, "loktantravani.vercel.app")
    canvas_obj.drawCentredString(w / 2, 22, f"Page {doc.page}")
    canvas_obj.drawRightString(w - 40, 22, "Confidential")

    canvas_obj.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        "/Users/adityaashok/Loktrantra Website/LoktantraVani_Project_Overview.pdf",
        pagesize=A4,
        topMargin=55, bottomMargin=50,
        leftMargin=40, rightMargin=40
    )

    story = []
    w = A4[0] - 80  # usable width

    # ════════════════════════════════════════════════════════
    # PAGE 1: COVER
    # ════════════════════════════════════════════════════════
    story.append(Spacer(1, 60))

    # Saffron band
    band_data = [[""]]
    band = Table(band_data, colWidths=[w], rowHeights=[8])
    band.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), SAFFRON)]))
    story.append(band)
    story.append(Spacer(1, 20))

    story.append(Paragraph("LoktantraVani", styles["title"]))
    story.append(Paragraph("India's 1st AI Newspaper", styles["subtitle"]))

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK))
    story.append(Spacer(1, 10))

    story.append(Paragraph(
        "A next-generation digital newspaper powered by Claude AI + Gemini, "
        "featuring deep-research journalism, AI-generated editorial illustrations, "
        "bilingual Hindi-English content, and citizen journalism through the "
        "\"Write With Us\" contributor platform.",
        styles["body"]
    ))

    story.append(Spacer(1, 20))

    # Key metrics table
    metrics = [
        ["PLATFORM", "TECH STACK", "AI MODELS", "LANGUAGES"],
        ["loktantravani.vercel.app", "Next.js 16 + Firebase", "Claude + Gemini + Imagen", "English + Hindi"],
    ]
    mt = Table(metrics, colWidths=[w/4]*4)
    mt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(mt)

    story.append(Spacer(1, 30))

    # Project info
    info_items = [
        ("Project Name", "LoktantraVani (Voice of Democracy)"),
        ("URL", "https://loktantravani.vercel.app"),
        ("Category", "AI-Powered Digital Journalism"),
        ("Founded", "March 2026"),
        ("Team", "Aditya Ashok (Founder & Editor-in-Chief)"),
        ("GitHub", "github.com/aditya-ashok/loktantravani"),
    ]
    for label, value in info_items:
        story.append(Paragraph(f"<b>{label}:</b> {value}", styles["body"]))

    story.append(Spacer(1, 30))
    story.append(Paragraph(
        "\"Democratizing journalism through AI — where every citizen has a voice.\"",
        styles["quote"]
    ))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # PAGE 2: PROBLEM & SOLUTION
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("1. The Problem", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    problems = [
        "<b>Media Concentration:</b> Indian news is dominated by a few large media houses, leaving millions of voices unheard.",
        "<b>Misinformation:</b> AI-generated fake news is rising, but AI is not being used to fight it with verified journalism.",
        "<b>Language Barrier:</b> Quality English journalism excludes Hindi-speaking India (500M+ people).",
        "<b>Youth Exclusion:</b> Young journalists lack platforms to publish without gatekeeping.",
        "<b>High Cost:</b> Running a newsroom requires expensive teams of reporters, editors, and designers.",
    ]
    for p in problems:
        story.append(Paragraph(p, styles["bullet"], bulletText="\u2022"))

    story.append(Spacer(1, 15))
    story.append(Paragraph("2. Our Solution", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    story.append(Paragraph(
        "LoktantraVani is India's first AI-powered newspaper that combines deep-research AI agents "
        "with citizen journalism. Our platform uses Claude (Anthropic) for hallucination-free article writing, "
        "Gemini (Google) for real-time search grounding and image generation, and a \"Write With Us\" system "
        "that empowers anyone to contribute vetted journalism.",
        styles["body"]
    ))

    story.append(Spacer(1, 10))

    # Architecture diagram as table
    arch = [
        ["STEP 1", "STEP 2", "STEP 3", "STEP 4"],
        [
            "Gemini + Google Search\nFinds real-time facts\nfrom PIB, Reuters, NDTV",
            "Claude AI\nWrites article using\nONLY verified facts",
            "Gemini Imagen 4.0\nGenerates unique\neditorial illustration",
            "Admin Review\nHuman editor approves\nbefore publishing"
        ],
    ]
    at = Table(arch, colWidths=[w/4]*4)
    at.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SAFFRON),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(at)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # PAGE 3: FEATURES
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("3. Key Features", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    features = [
        ("AI Deep-Research Agent", "Claude + Gemini two-step pipeline: search real facts first, then write. Zero hallucinations, full source attribution."),
        ("AI Image Generation", "Gemini Imagen 4.0 creates unique editorial illustrations for every article. Uploaded to Firebase Storage."),
        ("Bilingual (Hindi + English)", "Every article available in both languages. One-click AI translation preserves meaning and tone."),
        ("AI Voice Narration (TTS)", "Listen button on articles. AI reads the news aloud for accessibility and convenience."),
        ("\"Write With Us\" Platform", "Citizens register, write articles with AI grammar assistance, submit for editorial review."),
        ("AI Editorial Validation", "Admin triggers AI quality check: factuality, grammar, tone, originality, relevance scoring."),
        ("17 News Sections", "India, World, Politics, Geopolitics, Economy, Sports, Tech, Defence, Opinion, Cities, West Asia, Culture, Viral, Ancient India, Cartoon Mandala, IR, Markets."),
        ("NYT-Style Design", "New York Times-inspired broadsheet layout with saffron Indian branding. Dark mode support."),
        ("Admin Dashboard", "Complete CMS: post management, approval queue, user submissions, bulk AI generation, news agent, analytics."),
        ("Breaking News System", "Mark articles as breaking. Real-time ticker on homepage from Firestore."),
        ("Email Notifications", "Contributors notified via Resend when articles are approved or need revision."),
        ("Cartoon Mandala", "AI-generated satirical cartoons in the style of R.K. Laxman using Gemini Imagen."),
    ]

    for title, desc in features:
        story.append(KeepTogether([
            Paragraph(f"<b>{title}</b>", styles["h3"]),
            Paragraph(desc, styles["body"]),
        ]))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # PAGE 4: TECHNOLOGY STACK
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("4. Technology Stack", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    tech_data = [
        ["Layer", "Technology", "Purpose"],
        ["Frontend", "Next.js 16.2, React 19, TypeScript", "Server-side rendering, static generation"],
        ["Styling", "Tailwind CSS 4, Framer Motion", "NYT-style design system, animations"],
        ["Backend", "Vercel Serverless (Edge)", "API routes, 300s max duration"],
        ["Database", "Firebase Firestore (REST API)", "Posts, users, comments, reactions"],
        ["Auth", "Firebase Auth (Google + Email)", "Role-based access (admin/author/contributor/guest)"],
        ["Storage", "Firebase Storage", "AI-generated images, avatars"],
        ["AI Writing", "Claude Sonnet 4 (Anthropic)", "Deep-research article generation"],
        ["AI Search", "Gemini 2.0 Flash + Google Search", "Real-time fact grounding"],
        ["AI Images", "Gemini Imagen 4.0", "Editorial illustrations, cartoons"],
        ["AI Grammar", "Gemini 2.0 Flash", "Proofreading, quality scoring"],
        ["Email", "Resend API", "Contributor notifications"],
        ["Hosting", "Vercel (Edge Network)", "Global CDN, auto-scaling"],
        ["CI/CD", "GitHub + Vercel", "Auto-deploy on push"],
    ]
    tt = Table(tech_data, colWidths=[w*0.15, w*0.40, w*0.45])
    tt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(tt)

    story.append(Spacer(1, 20))
    story.append(Paragraph("5. WSIS Action Lines Alignment", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    wsis = [
        ("C2 - ICT Infrastructure", "Cloud-native serverless architecture scales globally without infrastructure barriers."),
        ("C3 - Access to Information", "AI-powered free news accessible to all. No paywall. Bilingual content."),
        ("C4 - Capacity Building", "\"Write With Us\" trains citizen journalists. AI grammar check builds writing skills."),
        ("C7 - ICT Applications", "AI Text-to-Speech makes news accessible to visually impaired users."),
        ("C8 - Cultural Diversity", "Hindi + English bilingual preserves India's linguistic identity in digital journalism."),
        ("C10 - Ethical Dimensions", "Anti-hallucination by design. Human-in-the-loop editorial. Transparent AI attribution."),
    ]
    for code, desc in wsis:
        story.append(Paragraph(f"<b>{code}:</b> {desc}", styles["bullet"], bulletText="\u2022"))

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # PAGE 5: YOUTH OPPORTUNITIES & ETHICS
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("6. Youth Opportunities", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    youth = [
        "<b>Citizen Journalism:</b> Young people register and publish on a national AI newspaper, building real portfolio.",
        "<b>AI-Assisted Writing:</b> Grammar checker teaches professional standards without gatekeeping access.",
        "<b>AI/ML Exposure:</b> Platform demonstrates generative AI applications, inspiring tech careers.",
        "<b>Bilingual Empowerment:</b> Hindi speakers participate equally in digital journalism.",
        "<b>Professional Visibility:</b> Contributors link LinkedIn/X profiles, creating career opportunities.",
        "<b>Regional Voice:</b> Cities section (Patna, Guwahati, Kolkata) gives Tier-2/3 youth a national platform.",
    ]
    for y in youth:
        story.append(Paragraph(y, styles["bullet"], bulletText="\u2022"))

    story.append(Spacer(1, 15))
    story.append(Paragraph("7. Ethical Considerations", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    ethics = [
        "<b>Anti-Hallucination:</b> Two-step architecture (Gemini searches facts, Claude writes from them only). No invented quotes or statistics.",
        "<b>Human-in-the-Loop:</b> All AI content requires admin approval. No auto-publishing.",
        "<b>Transparent Attribution:</b> Every AI article tagged with model + source info. Readers know what's AI-generated.",
        "<b>Content Moderation:</b> User submissions undergo AI validation + manual review before publishing.",
        "<b>No Deepfakes:</b> AI images are editorial illustrations only, never photorealistic deception.",
        "<b>Privacy:</b> User data in Firebase with role-based rules. No data used for AI training.",
        "<b>Bias Awareness:</b> Multiple editorial tones offered with transparent labeling.",
        "<b>Open Access:</b> Free to read, free to contribute. No paywalls.",
    ]
    for e in ethics:
        story.append(Paragraph(e, styles["bullet"], bulletText="\u2022"))

    story.append(Spacer(1, 20))
    story.append(Paragraph("8. \"Write With Us\" Flow", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    flow_data = [
        ["Step", "Action", "Technology"],
        ["1. Register", "User signs in with Google, fills profile\n(name, education, college, LinkedIn, X)", "Firebase Auth + Firestore"],
        ["2. Write", "Draft article in web editor\nRun AI grammar check", "Next.js + Gemini API"],
        ["3. Submit", "Article saved as 'user-submitted'\nAppears in admin panel", "Firestore REST API"],
        ["4. Review", "Admin runs AI Validation (5 scores)\nManual edit if needed", "Gemini AI Validation"],
        ["5. Publish", "Admin approves, article goes live\nContributor gets email notification", "Resend Email API"],
    ]
    ft = Table(flow_data, colWidths=[w*0.12, w*0.50, w*0.38])
    ft.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), SAFFRON),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(ft)

    story.append(PageBreak())

    # ════════════════════════════════════════════════════════
    # PAGE 6: SECTIONS & CONTACT
    # ════════════════════════════════════════════════════════
    story.append(Paragraph("9. News Sections (17)", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    sections = [
        ["Section", "GenZ Name", "Focus"],
        ["India", "Globe Drop", "National news, policy, governance"],
        ["World", "Globe Drop", "International affairs through Indian lens"],
        ["Politics", "Neta Watch", "Parliament, elections, democracy"],
        ["Geopolitics", "Power Moves", "Global strategy, India's role"],
        ["Economy", "Paisa Talk", "GDP, RBI, trade, fiscal policy"],
        ["Sports", "Game On", "Cricket, IPL, Olympics, kabaddi"],
        ["Tech", "Tech Bro", "AI, startups, ISRO, semiconductors"],
        ["Defence", "Shield & Sword", "Military, Atmanirbhar defence"],
        ["Opinion", "Hot Takes", "Editorials, perspectives, debate"],
        ["Cities", "City Vibes", "Delhi, Patna, Guwahati, Kolkata"],
        ["West Asia", "West Asia (Special)", "Middle East conflict, India's stakes"],
        ["Culture", "City Vibes", "Art, heritage, cinema, festivals"],
        ["Cartoon Mandala", "Cartoon Mandala", "AI satirical cartoons (R.K. Laxman style)"],
        ["Markets", "Paisa Talk", "Sensex, Nifty, stock analysis"],
        ["IR", "Power Moves", "International relations, diplomacy"],
        ["Viral", "Hot Takes", "Trending stories"],
        ["Ancient India", "--", "Civilizational wisdom"],
    ]
    st = Table(sections, colWidths=[w*0.18, w*0.22, w*0.60])
    st.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 7),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(st)

    story.append(Spacer(1, 25))
    story.append(Paragraph("10. Team", styles["h1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=SAFFRON))

    team_data = [
        ["Name", "Role", "Focus"],
        ["Aditya Ashok", "Founder & Editor-in-Chief", "Vision, product, AI architecture"],
        ["Ashok Kumar Choudhary", "Managing Editor", "Editorial standards, content quality"],
        ["Sanjay Saraogi", "Business & Economy Editor", "Economy, Markets, Finance"],
        ["Adarsh Ashok", "Tech & Defence Correspondent", "Technology, Defence, ISRO"],
        ["Seema Choudhary", "Cities & Culture Editor", "Cities, Culture, Heritage"],
        ["Shreya Rahul Anand", "Sr. Correspondent - Politics", "Politics, Governance, Policy"],
    ]
    tmt = Table(team_data, colWidths=[w*0.28, w*0.35, w*0.37])
    tmt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#dfdfdf")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(tmt)

    story.append(Spacer(1, 30))

    # Contact box
    contact_data = [[
        Paragraph(
            "<b>Contact</b><br/>"
            "Aditya Ashok | Founder & Editor-in-Chief<br/>"
            "Email: adityaashok.india@gmail.com<br/>"
            "Web: loktantravani.vercel.app<br/>"
            "GitHub: github.com/aditya-ashok/loktantravani",
            ParagraphStyle("contact", fontName="Helvetica", fontSize=9, textColor=DARK, leading=14)
        )
    ]]
    ct = Table(contact_data, colWidths=[w])
    ct.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("BOX", (0, 0), (-1, -1), 2, SAFFRON),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
    ]))
    story.append(ct)

    # Build
    doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    print("PDF generated: LoktantraVani_Project_Overview.pdf")


if __name__ == "__main__":
    build_pdf()
