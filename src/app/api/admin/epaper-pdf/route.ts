/**
 * GET /api/admin/epaper-pdf?date=2026-03-23&page=1
 * Multi-page newspaper E-Paper — one page per section
 * Without ?page, returns the full paper with all pages
 */

import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "loktantravani-2d159";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

type FsValue =
  | { stringValue: string }
  | { integerValue: string }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FsValue> } }
  | { arrayValue: { values: FsValue[] } };

function extract(fields: Record<string, FsValue>, key: string): string {
  const f = fields[key];
  if (!f) return "";
  if ("stringValue" in f) return f.stringValue;
  if ("integerValue" in f) return String(f.integerValue);
  if ("booleanValue" in f) return f.booleanValue ? "true" : "false";
  if ("timestampValue" in f) return f.timestampValue;
  return "";
}

type ArticleData = { title: string; titleHi: string; summary: string; content: string; category: string; author: string; imageUrl: string; createdAt: string };

const SECTION_ORDER = ["India", "World", "Politics", "Geopolitics", "Economy", "Sports", "Tech", "Defence", "Opinion", "Cities", "West Asia", "Lok Post"];

// Fetch real ads from Firestore
async function fetchAds(): Promise<{ title: string; brand: string; imageUrl: string; link: string }[]> {
  try {
    const res = await fetch(`${BASE}/ads?pageSize=50`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || [])
      .map((doc: { fields: Record<string, FsValue> }) => {
        const f = doc.fields || {};
        const active = f.active && "booleanValue" in f.active ? f.active.booleanValue : true;
        if (!active) return null;
        const placement = extract(f, "placement");
        if (placement && placement !== "epaper-only" && placement !== "all" && placement !== "between-articles") return null;
        return {
          title: extract(f, "title"),
          brand: extract(f, "brand"),
          imageUrl: extract(f, "imageUrl"),
          link: extract(f, "link"),
          priority: parseInt(extract(f, "priority") || "5", 10),
        };
      })
      .filter(Boolean)
      .sort((a: { priority: number }, b: { priority: number }) => b.priority - a.priority);
  } catch { return []; }
}

function renderAdSlot(ad: { title: string; brand: string; imageUrl: string; link: string } | null) {
  if (!ad) return '<div class="ad-slot"><div class="ad-label">ADVERTISEMENT</div><div class="ad-content">LoktantraVani — India\'s First AI Newspaper</div></div>';
  const img = ad.imageUrl ? `<img src="${ad.imageUrl}" alt="${ad.title}" style="max-width:100%;max-height:120px;object-fit:contain;margin:8px auto;display:block;" />` : "";
  const linkOpen = ad.link ? `<a href="${ad.link}" target="_blank" style="text-decoration:none;color:inherit;">` : "";
  const linkClose = ad.link ? "</a>" : "";
  return `<div class="ad-slot">${linkOpen}<div class="ad-label">ADVERTISEMENT</div>${img}<div class="ad-content">${ad.brand ? ad.brand + " — " : ""}${ad.title}</div>${linkClose}</div>`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function truncateWords(text: string, max: number): string {
  const words = text.split(/\s+/);
  return words.length > max ? words.slice(0, max).join(" ") + "…" : text;
}

/** Extract blockquotes from HTML content */
function extractQuotes(html: string): string[] {
  const quotes: string[] = [];
  const re = /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const clean = m[1].replace(/<[^>]*>/g, "").trim();
    if (clean.length > 20) quotes.push(clean);
  }
  return quotes.slice(0, 2);
}

/** Extract first sentence for pull quote */
function extractPullQuote(text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30);
  if (sentences.length > 2) return sentences[1].trim() + ".";
  return sentences[0]?.trim() + "." || "";
}

/** Generate key facts box from article */
function renderKeyFacts(title: string, content: string, pageIdx: number): string {
  const plain = stripHtml(content);
  const sentences = plain.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 6);
  // Extract sentences with numbers as "key facts"
  const factSentences = sentences.filter(s => /\d/.test(s)).slice(0, 3);
  const facts = factSentences.length >= 2 ? factSentences : sentences.slice(1, 4);
  if (facts.length === 0) return "";

  const types = ["keyfacts-box", "infographic-box", "timeline-box"];
  const boxType = types[pageIdx % types.length];

  if (boxType === "keyfacts-box") {
    return `<div class="keyfacts-box">
      <div class="kf-title">■ Key Facts</div>
      ${facts.map(f => `<div class="kf-item">▸ ${f.trim().slice(0, 120)}</div>`).join("")}
    </div>`;
  }
  if (boxType === "infographic-box") {
    return `<div class="infographic-box">
      <div class="kf-title">◆ At a Glance</div>
      ${facts.map(f => `<div class="info-item">${f.trim().slice(0, 100)}</div>`).join("")}
    </div>`;
  }
  // timeline
  return `<div class="timeline-box">
    <div class="kf-title">◉ Background</div>
    ${facts.map((f, i) => `<div class="tl-item"><span class="tl-dot">${i + 1}</span> ${f.trim().slice(0, 110)}</div>`).join("")}
  </div>`;
}

/** Render a pull quote block */
function renderPullQuote(text: string): string {
  if (!text || text.length < 30) return "";
  return `<div class="pull-quote">
    <div class="pq-mark">"</div>
    <div class="pq-text">${text.slice(0, 180)}</div>
  </div>`;
}

/**
 * House promos — how real papers fill leftover column inches. Rotated
 * deterministically per page; injected only when a page runs light.
 */
const HOUSE_PROMOS = [
  `<div class="promo promo-dark">
    <img class="promo-img" src="https://firebasestorage.googleapis.com/v0/b/loktantravani-2d159.firebasestorage.app/o/caricatures%2F1783246528118-h09idm.png?alt=media&token=3a58255d-eb8d-4fb9-a1bf-26029e67def8" alt="" />
    <div class="promo-text">
      <div class="promo-kicker">Every morning · 7:30 AM</div>
      <div class="promo-title">The Vani Morning Brief</div>
      <div class="promo-body">India's first AI-composed daily digest — the banner story, today at a glance, and the editorial, in your inbox before chai.</div>
      <div class="promo-cta">Subscribe free → loktantravani.in</div>
    </div>
  </div>`,
  `<div class="promo promo-border">
    <img class="promo-img" src="https://firebasestorage.googleapis.com/v0/b/loktantravani-2d159.firebasestorage.app/o/caricatures%2F1783246553699-iwle06.png?alt=media&token=fcf1cfc1-16bd-4385-9ca5-5c47fc639e3e" alt="" />
    <div class="promo-text">
      <div class="promo-kicker">Your byline here</div>
      <div class="promo-title">Write for LoktantraVani</div>
      <div class="promo-body">Reporters, columnists, satirists — pitch us. AI-assisted editing, real readership, and a national platform for your voice.</div>
      <div class="promo-cta">Apply → loktantravani.in/write</div>
    </div>
  </div>`,
  `<div class="promo promo-orange">
    <img class="promo-img" src="https://firebasestorage.googleapis.com/v0/b/loktantravani-2d159.firebasestorage.app/o/caricatures%2F1783246562988-1363ne.png?alt=media&token=317eece7-a749-41c3-bf05-571e3e22e9fb" alt="" />
    <div class="promo-text">
      <div class="promo-kicker">Advertise with us</div>
      <div class="promo-title">Reach New India, Every Day</div>
      <div class="promo-body">Homepage, articles and this very e-paper — one campaign, every surface. Priority placements for early partners.</div>
      <div class="promo-cta">Book space → loktantravani.in</div>
    </div>
  </div>`,
  `<div class="promo promo-border">
    <img class="promo-img" src="https://firebasestorage.googleapis.com/v0/b/loktantravani-2d159.firebasestorage.app/o/caricatures%2F1783246570169-n5i9zo.png?alt=media&token=3cbcfc40-dab6-4708-81a0-71b0321db70e" alt="" />
    <div class="promo-text">
      <div class="promo-kicker">पढ़िए हिंदी में</div>
      <div class="promo-title">लोकतंत्रवाणी हिंदी संस्करण</div>
      <div class="promo-body">वही खबरें, वही विश्लेषण — शुद्ध हिंदी में। हर लेख का हिंदी संस्करण स्वतः तैयार होता है।</div>
      <div class="promo-cta">hindi.loktantravani.in</div>
    </div>
  </div>`,
  `<div class="promo promo-dark">
    <img class="promo-img" src="https://firebasestorage.googleapis.com/v0/b/loktantravani-2d159.firebasestorage.app/o/caricatures%2F1783246577457-5pfgla.png?alt=media&token=cfe7e566-081f-4c54-b420-d0f6af92f459" alt="" />
    <div class="promo-text">
      <div class="promo-kicker">Ask the newsroom</div>
      <div class="promo-title">Meet VaniBot</div>
      <div class="promo-body">Our AI news assistant answers your questions on any story, in English or Hindi — right on the site, round the clock.</div>
      <div class="promo-cta">Chat now → loktantravani.in</div>
    </div>
  </div>`,
];

/**
 * Client-side gap filler: measures each rendered page (after images load)
 * and inserts as many house promos as actually fit in the leftover space.
 * Server-side word counts can't see real rendered heights, so this is the
 * only reliable way to leave no blank column inches.
 */
function fillerScript(): string {
  return `<script>
  var PROMOS = ${JSON.stringify(HOUSE_PROMOS)};
  window.addEventListener("load", function () {
    var k = 0;
    document.querySelectorAll(".page").forEach(function (page) {
      var footer = page.querySelector(".page-footer");
      if (!footer) return;
      var measure = function () {
        var kids = Array.prototype.filter.call(page.children, function (el) { return el !== footer; });
        var last = kids[kids.length - 1];
        return last ? page.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom - 40 : 0;
      };
      var inserted = null;
      for (var i = 0; i < 6; i++) {
        if (measure() < 130) break;
        inserted = document.createElement("div");
        inserted.className = "filler-row filler-1";
        inserted.innerHTML = PROMOS[k++ % PROMOS.length];
        page.insertBefore(inserted, footer);
      }
      // Absorb whatever sliver remains into the last promo's padding so the
      // page ends flush at the footer like a typeset broadsheet.
      var leftover = measure();
      if (inserted && leftover > 12) {
        var promoEl = inserted.querySelector(".promo");
        if (promoEl) {
          var pad = Math.min(leftover / 2, 70);
          promoEl.style.paddingTop = (12 + pad) + "px";
          promoEl.style.paddingBottom = (12 + pad) + "px";
        }
      }
    });
  });
  </script>`;
}

function renderPage(sectionName: string, articles: ArticleData[], pageNum: number, totalPages: number, dateFormatted: string) {
  if (articles.length === 0) return "";

  const lead = articles[0];
  const rest = articles.slice(1);
  const dateStr = (a: ArticleData) => a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "";

  const leadImg = lead.imageUrl && !lead.imageUrl.startsWith("data:") ? lead.imageUrl : "";
  const leadBody = stripHtml(lead.content || "");
  // Show full content — pages expand as needed
  const leadTrunc = leadBody;
  const leadQuotes = extractQuotes(lead.content || "");
  const leadPullQuote = leadQuotes.length > 0 ? leadQuotes[0] : extractPullQuote(leadBody);
  // Alternate layout: even pages = image right, odd = image top
  const leadLayout = pageNum % 2 === 0 ? "side" : "top";

  // Split remaining articles into left and right columns
  const leftCol = rest.filter((_, i) => i % 2 === 0);
  const rightCol = rest.filter((_, i) => i % 2 === 1);

  let colIdx = 0;
  function renderColArticle(a: ArticleData) {
    colIdx++;
    const hasImg = a.imageUrl && !a.imageUrl.startsWith("data:");
    // Show full article content
    const body = stripHtml(a.content || "");
    const colQuotes = extractQuotes(a.content || "");
    const colPull = colQuotes.length > 0 ? colQuotes[0] : "";
    const extraEl = colIdx % 2 === 0
      ? renderKeyFacts(a.title, a.content || "", colIdx + pageNum)
      : renderPullQuote(colPull);

    // Alternate: full-width image above or small inline grid
    if (colIdx % 2 === 1 && hasImg) {
      // Full-width image above text
      return `<div class="col-article">
        <img src="${a.imageUrl}" class="col-art-img" alt="" />
        <h3>${a.title}</h3>
        ${a.titleHi ? `<p class="col-title-hi">${a.titleHi}</p>` : ""}
        <div class="col-byline">By ${a.author} · ${dateStr(a)}</div>
        <p class="col-body">${body}</p>
        ${extraEl}
      </div>`;
    }
    // Text with small image grid
    return `<div class="col-article">
      ${hasImg ? `<div class="col-art-grid"><div><h3>${a.title}</h3>
        ${a.titleHi ? `<p class="col-title-hi">${a.titleHi}</p>` : ""}
        <div class="col-byline">By ${a.author} · ${dateStr(a)}</div></div>
        <img src="${a.imageUrl}" class="col-art-thumb" alt="" /></div>`
        : `<h3>${a.title}</h3>
        ${a.titleHi ? `<p class="col-title-hi">${a.titleHi}</p>` : ""}
        <div class="col-byline">By ${a.author} · ${dateStr(a)}</div>`}
      <p class="col-body">${body}</p>
      ${extraEl}
    </div>`;
  }

  return `
  <div class="page" id="page-${pageNum}">
    <div class="page-header">
      <span class="page-section">${sectionName}</span>
      <span class="page-title">LoktantraVani</span>
      <span class="page-info">${dateFormatted} · Page ${pageNum} of ${totalPages}</span>
    </div>

    <!-- Lead Story -->
    <div class="lead-story">
      ${leadLayout === "top" && leadImg ? `<img src="${leadImg}" class="lead-img-top" alt="" />` : ""}
      <h2 class="lead-headline">${lead.title}</h2>
      ${lead.titleHi ? `<div class="lead-headline-hi">${lead.titleHi}</div>` : ""}
      <div class="lead-byline">By ${lead.author} · ${dateStr(lead)} · ${sectionName}</div>
      ${lead.summary ? `<div class="lead-summary">${lead.summary}</div>` : ""}
      ${leadLayout === "side" && leadImg
        ? `<div class="lead-grid">
            <div class="lead-grid-text"><p>${leadTrunc}</p></div>
            <div class="lead-grid-img"><img src="${leadImg}" alt="" />${renderKeyFacts(lead.title, lead.content || "", pageNum)}</div>
          </div>`
        : `<div class="lead-content"><p>${leadTrunc}</p></div>
          ${renderKeyFacts(lead.title, lead.content || "", pageNum)}`
      }
      ${renderPullQuote(leadPullQuote)}
    </div>

    <!-- Remaining articles: two-column grid, or full-width when only one
         is left (a lone article in a half-empty grid reads as a blank page) -->
    ${rest.length === 1 ? `
    <hr class="section-divider" />
    <div class="single-col">${renderColArticle(rest[0])}</div>` : ""}
    ${rest.length > 1 ? `
    <hr class="section-divider" />
    <div class="columns">
      <div class="col">
        ${leftCol.map(renderColArticle).join('<hr class="col-rule" />')}
      </div>
      <div class="col-divider"></div>
      <div class="col">
        ${rightCol.map(renderColArticle).join('<hr class="col-rule" />')}
      </div>
    </div>` : ""}

    <div class="page-footer">
      <span>LoktantraVani</span>
      <span>loktantravani.vercel.app</span>
      <span>Page ${pageNum}</span>
    </div>
  </div>`;
}

type EditionPlan = {
  leadTitle: string;
  bannerHeadline: string;
  deck: string;
  atAGlance: string[];
  editorial: { title: string; body: string } | null;
  quoteOfDay: { text: string; by: string } | null;
  printHeadlines: { title: string; headline: string }[];
};

/** Fetch the AI-composed edition plan for a date (created by /api/epaper-generate) */
async function fetchEdition(date: string): Promise<EditionPlan | null> {
  try {
    const res = await fetch(`${BASE}/editions/${date}`, { cache: "no-store" });
    if (!res.ok) return null;
    const doc = await res.json();
    const planStr = doc.fields?.plan?.stringValue;
    if (!planStr) return null;
    return JSON.parse(planStr) as EditionPlan;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0];
  const download = req.nextUrl.searchParams.get("download") === "true";
  const requestedPage = req.nextUrl.searchParams.get("page");

  // Fetch ads + AI edition plan in parallel
  const [adsData, edition] = await Promise.all([fetchAds(), fetchEdition(dateParam)]);

  const res = await fetch(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "posts" }],
        where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
        limit: 200,
      },
    }),
    cache: "no-store",
  });

  const results = await res.json();
  const posts: ArticleData[] = (results || [])
    .filter((r: Record<string, unknown>) => r.document)
    .map((r: { document: { name: string; fields: Record<string, FsValue> } }) => {
      const f = r.document.fields || {};
      return {
        title: extract(f, "title"), titleHi: extract(f, "titleHi"), summary: extract(f, "summary"),
        content: extract(f, "content"), category: extract(f, "category"), author: extract(f, "author"),
        imageUrl: extract(f, "imageUrl"), createdAt: extract(f, "createdAt"),
        inEpaper: extract(f, "inEpaper"),
      };
    })
    .filter((p: ArticleData & { inEpaper?: string }) => {
      if (!p.createdAt) return true;
      try { return new Date(p.createdAt) <= new Date(dateParam + "T23:59:59+05:30"); } catch { return true; }
    });

  // The paper only carries the last 2 days of news — inEpaper marks
  // accumulate across editions, so an age gate keeps old stories out.
  const freshCutoff = new Date(dateParam + "T23:59:59+05:30").getTime() - 48 * 3600 * 1000;
  const isFresh = (p: ArticleData) => {
    try { return new Date(p.createdAt).getTime() >= freshCutoff; } catch { return false; }
  };

  // Prefer posts explicitly marked for the E-Paper; if none are marked
  // (edition not generated yet), fall back to any fresh published posts
  // so the paper is never blank.
  let paperPosts = posts.filter((p: ArticleData & { inEpaper?: string }) => (p.inEpaper === "true" || p.inEpaper === "1") && isFresh(p));
  if (paperPosts.length === 0) {
    paperPosts = posts.filter(isFresh);
    if (paperPosts.length === 0) paperPosts = posts.slice(0, 15);
  }

  // Apply AI print headlines from the edition plan (keep original for matching)
  const headlineOverride = new Map((edition?.printHeadlines || []).map(h => [h.title, h.headline]));
  for (const p of paperPosts) {
    (p as ArticleData & { origTitle?: string }).origTitle = p.title;
    const punchier = headlineOverride.get(p.title);
    if (punchier) p.title = punchier;
  }

  // Group by section — no article limit per section
  const sections: Record<string, ArticleData[]> = {};
  for (const p of paperPosts) {
    const cat = p.category || "General";
    if (!sections[cat]) sections[cat] = [];
    sections[cat].push(p);
  }

  // Page allocation formula: bigger sections get more pages
  const PAGE_ALLOCATION: Record<string, number> = {
    Opinion: 3, Politics: 2, Geopolitics: 2, India: 3,
    Economy: 2, "West Asia": 2, Defence: 2, Sports: 2,
    Tech: 2, Cities: 2, World: 2, "Lok Post": 1,
  };
  // Each page fits ~2 full articles or 1 lead + 2 columns
  const ARTICLES_PER_PAGE = 3;

  const activeSections = SECTION_ORDER.filter(s => sections[s]?.length > 0);
  const extraSections = Object.keys(sections).filter(s => !SECTION_ORDER.includes(s) && sections[s].length > 0);
  const allSections = [...activeSections, ...extraSections];

  // Build page plan: each section gets allocated pages
  type PagePlan = { section: string; articles: ArticleData[]; pageLabel: string };
  const pagesPlan: PagePlan[] = [];
  for (const sec of allSections) {
    const arts = sections[sec] || [];
    const allocPages = Math.max(1, Math.min(PAGE_ALLOCATION[sec] || 1, Math.ceil(arts.length / ARTICLES_PER_PAGE)));
    for (let pg = 0; pg < allocPages; pg++) {
      const start = pg * ARTICLES_PER_PAGE;
      const chunk = arts.slice(start, start + ARTICLES_PER_PAGE);
      if (chunk.length === 0) break;
      pagesPlan.push({
        section: sec,
        articles: chunk,
        pageLabel: allocPages > 1 ? `${sec} (${pg + 1}/${allocPages})` : sec,
      });
    }
  }
  const totalPages = pagesPlan.length + 1; // +1 for front page

  const dateFormatted = new Date(dateParam + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Noto+Serif:wght@400;700&family=Source+Serif+4:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 0.5cm; }
  body { font-family: 'Noto Serif', 'Source Serif 4', Georgia, serif; color: #1a1a1a; background: #f0f0f0; font-size: 8px; line-height: 1.4; }

  .page {
    width: 210mm; min-height: 297mm; max-width: 210mm;
    margin: 0 auto 20px; background: #ffffff;
    border: 1px solid #ccc; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    padding: 14px 18px 44px; position: relative;
    page-break-after: always; overflow: hidden;
  }

  .page-header {
    display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: 2px solid #1a1a1a; padding-bottom: 4px; margin-bottom: 12px;
  }
  .page-section { font-family: 'Playfair Display', serif; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; color: #c41e1e; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 900; letter-spacing: -0.5px; }
  .page-info { font-size: 7px; color: #888; letter-spacing: 1px; text-transform: uppercase; }

  /* ── Lead Story ── */
  .lead-story { margin-bottom: 14px; border-bottom: 1px solid #1a1a1a; padding-bottom: 12px; }
  .lead-img-top { width: 100%; height: 160px; object-fit: cover; margin-bottom: 6px; }
  .lead-headline { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; line-height: 1.1; margin-bottom: 2px; letter-spacing: -0.5px; }
  .lead-headline-hi { font-size: 13px; color: #555; margin-bottom: 4px; font-style: italic; }
  .lead-summary { font-size: 10px; color: #444; line-height: 1.5; margin-bottom: 4px; font-style: italic; }
  .lead-byline { font-size: 7px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 6px; }
  .lead-content { font-size: 8.5px; line-height: 1.5; color: #333; column-count: 3; column-gap: 18px; column-rule: 0.5px solid #ccc; text-align: justify; hyphens: auto; }
  .lead-content p { margin-bottom: 4px; text-indent: 12px; }
  .lead-content p:first-child { text-indent: 0; }

  /* Lead grid layout: text left, image right */
  .lead-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 16px; margin-top: 6px; }
  .lead-grid-text { font-size: 8.5px; line-height: 1.5; color: #333; text-align: justify; hyphens: auto; column-count: 2; column-gap: 14px; column-rule: 0.5px solid #ccc; }
  .lead-grid-text p { margin-bottom: 4px; text-indent: 12px; }
  .lead-grid-text p:first-child { text-indent: 0; }
  .lead-grid-img { }
  .lead-grid-img img { width: 100%; height: 200px; object-fit: cover; margin-bottom: 8px; }

  /* ── Two-column grid ── */
  .columns { display: grid; grid-template-columns: 1fr 1px 1fr; gap: 16px; }
  .col-divider { background: #bbb; }
  .col { }
  .col-rule { border: none; border-top: 0.5px solid #ccc; margin: 10px 0; }

  /* ── Column articles (compact newspaper style) ── */
  .col-article { margin-bottom: 10px; overflow: hidden; }
  .col-art-img { width: 100%; height: 100px; object-fit: cover; margin-bottom: 4px; }
  .col-article h3 { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 900; line-height: 1.15; margin-bottom: 1px; }
  .col-title-hi { font-size: 8px; color: #777; font-style: italic; margin-bottom: 2px; }
  .col-byline { font-size: 6.5px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 3px; }
  .col-body { font-size: 8px; line-height: 1.45; color: #444; text-align: justify; hyphens: auto; text-indent: 10px; }
  .col-art-grid { display: grid; grid-template-columns: 1fr 90px; gap: 8px; align-items: start; }
  .col-art-thumb { width: 90px; height: 70px; object-fit: cover; }

  /* ── Key facts, infographics, quotes ── */
  .keyfacts-box { background: #f7f7f7; border: 1px solid #ddd; padding: 8px 10px; margin: 8px 0; }
  .keyfacts-box .kf-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c41e1e; margin-bottom: 4px; }
  .keyfacts-box .kf-item { font-size: 7.5px; line-height: 1.5; color: #333; padding: 2px 0; border-bottom: 0.5px dotted #d4c9b8; }

  .infographic-box { background: #1a1a1a; color: #fff; padding: 10px 12px; margin: 8px 0; }
  .infographic-box .kf-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #ff9933; margin-bottom: 4px; }
  .infographic-box .info-item { font-size: 7.5px; line-height: 1.5; color: #ddd; padding: 2px 0; border-bottom: 0.5px solid #333; }

  .timeline-box { border-left: 2px solid #c41e1e; padding: 6px 0 6px 12px; margin: 8px 0; }
  .timeline-box .kf-title { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #c41e1e; margin-bottom: 4px; }
  .timeline-box .tl-item { font-size: 7.5px; line-height: 1.5; color: #444; padding: 2px 0; position: relative; }
  .timeline-box .tl-dot { display: inline-block; width: 14px; height: 14px; background: #c41e1e; color: #fff; text-align: center; line-height: 14px; font-size: 7px; font-weight: 700; border-radius: 50%; margin-right: 4px; }

  .pull-quote { border-top: 2px solid #c41e1e; border-bottom: 2px solid #c41e1e; padding: 8px 4px; margin: 10px 0; text-align: center; }
  .pull-quote .pq-mark { font-family: 'Playfair Display', serif; font-size: 32px; color: #c41e1e; line-height: 0.8; }
  .pull-quote .pq-text { font-family: 'Playfair Display', serif; font-size: 10px; font-style: italic; color: #333; line-height: 1.4; }

  .section-divider { border: none; border-top: 1px solid #1a1a1a; margin: 12px 0; position: relative; }
  .section-divider::after { content: "✦"; position: absolute; top: -7px; left: 50%; transform: translateX(-50%); background: #ffffff; padding: 0 6px; font-size: 8px; color: #999; }

  /* ── Dynamic photo positions ── */
  .img-full { width: 100%; height: 100px; object-fit: cover; margin-bottom: 4px; }
  .img-left { width: 45%; height: 80px; object-fit: cover; float: left; margin: 0 10px 6px 0; }
  .img-right { width: 45%; height: 80px; object-fit: cover; float: right; margin: 0 0 6px 10px; }
  .img-small { width: 30%; height: 60px; object-fit: cover; float: left; margin: 0 8px 4px 0; }

  /* Column article image variations — no floats, grid-safe */
  .art-sep { border: none; border-top: 0.5px solid #ccc; margin: 10px 0; clear: both; }

  .page-footer {
    position: absolute; bottom: 12px; left: 18px; right: 18px;
    display: flex; justify-content: space-between;
    font-size: 6.5px; color: #aaa; text-transform: uppercase; letter-spacing: 2px;
    border-top: 0.5px solid #ddd; padding-top: 4px;
  }

  /* ── Front page ── */
  .front-page .masthead { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 10px; margin-bottom: 16px; }
  .front-page .masthead h1 { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 900; letter-spacing: -1px; line-height: 1; }
  .front-page .masthead .date { font-size: 9px; text-transform: uppercase; letter-spacing: 4px; color: #555; margin-top: 2px; }
  .front-page .masthead .tagline { font-size: 7px; text-transform: uppercase; letter-spacing: 4px; color: #888; margin-top: 1px; }
  .front-page .masthead .byline-tag { font-size: 6.5px; color: #c41e1e; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }

  /* ── Front page 3-column layout ── */
  .fp-layout { display: grid; grid-template-columns: 5fr 1px 2.5fr; gap: 14px; margin-top: 10px; }
  .fp-rule { background: #bbb; }
  .fp-main { }
  .fp-sidebar { }

  .fp-lead { margin-bottom: 10px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 8px; }
  .fp-excerpt { font-size: 8px; line-height: 1.5; color: #444; column-count: 2; column-gap: 14px; column-rule: 0.5px solid #ddd; margin-top: 6px; text-align: justify; }
  .fp-sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

  .front-page .hl { margin-bottom: 8px; border-bottom: 0.5px solid #ddd; padding-bottom: 6px; }
  .front-page .hl h2 { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 900; line-height: 1.15; }
  .front-page .hl .cat { font-size: 6.5px; color: #c41e1e; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 1px; }
  .front-page .hl p { font-size: 8px; color: #444; margin-top: 2px; line-height: 1.4; }
  .front-page .hl .hl-byline { font-size: 6px; color: #999; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }

  .fp-sidebar .hl h2 { font-size: 11px; }
  .fp-sidebar .hl p { font-size: 7px; }

  /* Vertical TOC in right sidebar */
  .toc-vertical { border: 1.5px solid #1a1a1a; padding: 8px 10px; margin-top: 10px; }
  .toc-vertical h3 { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; border-bottom: 0.5px solid #ccc; padding-bottom: 3px; }
  .toc-v-item { display: flex; justify-content: space-between; font-size: 7px; padding: 2px 0; border-bottom: 0.5px dotted #ddd; }
  .toc-v-item span:first-child { font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
  .toc-v-item .page-no { color: #c41e1e; font-weight: 700; }

  /* ── Single leftover article: full width, body flows in 3 columns ── */
  .single-col .col-article { margin-bottom: 10px; }
  .single-col .col-body { column-count: 3; column-gap: 16px; column-rule: 0.5px solid #ccc; text-indent: 10px; }
  .single-col .col-art-img { height: 140px; }

  /* ── House promo fillers (classic self-ads for leftover column inches) ── */
  .filler-row { display: grid; gap: 12px; margin-top: 14px; }
  .filler-1 { grid-template-columns: 1fr; }
  .filler-2 { grid-template-columns: 1fr 1fr; }
  .filler-3 { grid-template-columns: 1fr 1fr 1fr; }
  .promo { padding: 12px 16px; display: flex; align-items: center; gap: 16px; text-align: left; page-break-inside: avoid; }
  .promo-img { width: 150px; height: 90px; object-fit: cover; flex-shrink: 0; border: 1.5px solid rgba(0,0,0,0.25); }
  .promo-dark .promo-img { border-color: rgba(255,153,51,0.6); }
  .promo-text { flex: 1; min-width: 0; }
  .filler-2 .promo, .filler-3 .promo { flex-direction: column; text-align: center; }
  .filler-2 .promo-img, .filler-3 .promo-img { width: 100%; height: 70px; }
  .promo-dark { background: #1a1a1a; color: #fff; }
  .promo-dark .promo-cta { color: #ff9933; }
  .promo-border { border: 2px solid #1a1a1a; background: #fbf9f4; color: #1a1a1a; }
  .promo-border .promo-cta { color: #c41e1e; }
  .promo-orange { background: #ff9933; color: #1a1a1a; }
  .promo-orange .promo-cta { color: #7a1010; }
  .promo-kicker { font-size: 6.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin-bottom: 4px; }
  .promo-title { font-family: 'Playfair Display', serif; font-size: 15px; font-weight: 900; line-height: 1.1; margin-bottom: 5px; }
  .promo-body { font-size: 7.5px; line-height: 1.5; opacity: 0.85; margin-bottom: 6px; }
  .promo-cta { font-size: 7.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }

  /* ── AI edition blocks ── */
  .banner-block { text-align: center; border-bottom: 2px solid #1a1a1a; padding: 4px 0 10px; margin-bottom: 10px; }
  .banner-headline { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 900; line-height: 1.05; letter-spacing: -0.5px; }
  .banner-deck { font-size: 10px; font-style: italic; color: #555; margin-top: 4px; }

  .glance-box { border: 2px solid #1a1a1a; padding: 8px 10px; margin-bottom: 10px; background: #fbf9f4; }
  .glance-box h3 { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #c41e1e; border-bottom: 1px solid #1a1a1a; padding-bottom: 3px; margin-bottom: 5px; }
  .glance-item { font-size: 7.5px; line-height: 1.5; color: #333; padding: 2px 0; border-bottom: 0.5px dotted #ccc; }
  .glance-item:last-child { border-bottom: none; }

  .editorial-box { border-top: 3px double #1a1a1a; border-bottom: 3px double #1a1a1a; padding: 10px 14px; margin-top: 12px; background: #fdfcf9; }
  .editorial-box .ed-label { font-size: 7px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #c41e1e; margin-bottom: 3px; }
  .editorial-box h3 { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 900; margin-bottom: 5px; }
  .editorial-box p { font-size: 8px; line-height: 1.55; color: #333; text-align: justify; margin-bottom: 4px; text-indent: 12px; }
  .editorial-box p:first-of-type { text-indent: 0; }

  .qod-box { border-left: 3px solid #c41e1e; background: #faf7f2; padding: 8px 10px; margin: 10px 0; }
  .qod-box .qod-label { font-size: 6.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 2.5px; color: #c41e1e; margin-bottom: 3px; }
  .qod-box .qod-text { font-family: 'Playfair Display', serif; font-size: 10px; font-style: italic; line-height: 1.4; color: #222; }
  .qod-box .qod-by { font-size: 7px; color: #777; margin-top: 3px; text-transform: uppercase; letter-spacing: 1px; }

  /* ── Ads ── */
  .ad-slot {
    background: #f5f5f5; border: 0.5px solid #ddd; padding: 8px; margin: 14px 0; text-align: center;
    page-break-inside: avoid;
  }
  .ad-label { font-size: 5.5px; text-transform: uppercase; letter-spacing: 3px; color: #999; margin-bottom: 2px; }
  .ad-content { font-size: 9px; font-weight: 700; color: #333; letter-spacing: 0.5px; }

  /* ── Navigation bar ── */
  .nav-bar {
    position: sticky; top: 0; z-index: 100; background: #1a1a1a; color: #fff;
    padding: 8px 16px; display: flex; justify-content: space-between; align-items: center;
    font-family: -apple-system, sans-serif;
  }
  .nav-bar a, .nav-bar button { color: #fff; text-decoration: none; font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 1.5px; background: none; border: none; cursor: pointer; font-family: inherit; }
  .nav-bar .pages { display: flex; gap: 3px; flex-wrap: wrap; }
  .nav-bar .pages a { padding: 3px 8px; border: 1px solid #444; font-size: 8px; }
  .nav-bar .pages a.active { background: #c41e1e; border-color: #c41e1e; }
  .nav-bar .pages a:hover { background: #333; }

  @media print {
    .nav-bar { display: none; }
    .page { box-shadow: none; border: none; margin: 0; padding: 10px 14px; page-break-after: always; background: #fff; width: 210mm; min-height: 297mm; }
    body { background: #fff; }
  }
  @media screen and (max-width: 768px) {
    .page { padding: 12px; }
    .lead-content { column-count: 1; }
    .columns { grid-template-columns: 1fr; }
    .col-divider { display: none; }
    .fp-layout { grid-template-columns: 1fr; }
    .fp-rule { display: none; }
    .fp-sub-grid { grid-template-columns: 1fr; }
    .fp-excerpt { column-count: 1; }
    .lead-headline { font-size: 20px; }
  }`;

  // Build TOC with page numbers from plan
  const sectionStartPages: Record<string, number> = {};
  pagesPlan.forEach((p, i) => {
    if (!sectionStartPages[p.section]) sectionStartPages[p.section] = i + 2;
  });

  // Front page: summary of top stories with "more on page X"
  const frontPageHeadlines = allSections.slice(0, 10).map(s => {
    const top = sections[s]?.[0];
    const pg = sectionStartPages[s] || 2;
    return top ? { ...top, sectionName: s, pageNo: pg } : null;
  }).filter(Boolean) as (ArticleData & { sectionName: string; pageNo: number; origTitle?: string })[];

  // AI edition chose a lead story — promote it to the top of the front page
  if (edition?.leadTitle) {
    const leadIdx = frontPageHeadlines.findIndex(h => h.origTitle === edition.leadTitle || h.title === edition.leadTitle);
    if (leadIdx > 0) {
      const [aiLead] = frontPageHeadlines.splice(leadIdx, 1);
      frontPageHeadlines.unshift(aiLead);
    }
  }

  // Get first few sentences from lead story for front page excerpt
  const leadExcerpt = frontPageHeadlines[0] ? stripHtml(sections[frontPageHeadlines[0].sectionName]?.[0]?.content || "").split(/[.!?]/).slice(0, 4).join(". ") + "." : "";

  const bannerHTML = edition?.bannerHeadline ? `
    <div class="banner-block">
      <h2 class="banner-headline">${edition.bannerHeadline}</h2>
      ${edition.deck ? `<p class="banner-deck">${edition.deck}</p>` : ""}
    </div>` : "";

  const glanceHTML = edition?.atAGlance?.length ? `
    <div class="glance-box">
      <h3>Today at a Glance</h3>
      ${edition.atAGlance.map(g => `<div class="glance-item">▸ ${g}</div>`).join("")}
    </div>` : "";

  const editorialHTML = edition?.editorial?.body ? `
    <div class="editorial-box">
      <div class="ed-label">✒ The LoktantraVani View</div>
      <h3>${edition.editorial.title || "Editorial"}</h3>
      ${edition.editorial.body.split(/\n+/).map(p => `<p>${p}</p>`).join("")}
    </div>` : "";

  const qodHTML = edition?.quoteOfDay?.text ? `
    <div class="qod-box">
      <div class="qod-label">Quote of the Day</div>
      <div class="qod-text">"${edition.quoteOfDay.text}"</div>
      <div class="qod-by">— ${edition.quoteOfDay.by || "Reported"}</div>
    </div>` : "";

  const frontPageHTML = `
  <div class="page front-page" id="page-0">
    <div class="masthead">
      <h1>LoktantraVani</h1>
      <div class="date">${dateFormatted}</div>
      <div class="tagline">India's First AI Newspaper — Neo Bharat Edition</div>
      <div class="byline-tag">${paperPosts.length} Articles · ${allSections.length} Sections · ${totalPages} Pages${edition ? " · AI-Composed Edition" : ""}</div>
    </div>

    ${bannerHTML}

    ${renderAdSlot(adsData[0] || null)}

    <!-- Main content: 3 columns — stories | rule | sidebar with TOC -->
    <div class="fp-layout">
      <div class="fp-main">
        <!-- Lead Story -->
        ${frontPageHeadlines[0] ? `
        <div class="hl fp-lead">
          <div class="cat">${frontPageHeadlines[0].sectionName} <span style="color:#888;font-weight:400;">· p.${frontPageHeadlines[0].pageNo}</span></div>
          ${frontPageHeadlines[0].imageUrl && !frontPageHeadlines[0].imageUrl.startsWith("data:") ? `<img src="${frontPageHeadlines[0].imageUrl}" alt="" style="width:100%;height:180px;object-fit:cover;margin-bottom:6px;" />` : ""}
          <h2 style="font-size:24px;">${frontPageHeadlines[0].title}</h2>
          <p style="font-size:10px;line-height:1.5;margin-top:4px;">${(frontPageHeadlines[0].summary || "").slice(0, 250)}</p>
          <div class="fp-excerpt">${leadExcerpt.slice(0, 500)}</div>
          <div class="hl-byline">By ${frontPageHeadlines[0].author} · <span style="color:#c41e1e;">More on page ${frontPageHeadlines[0].pageNo} →</span></div>
        </div>` : ""}

        <!-- 2-column sub-stories -->
        <div class="fp-sub-grid">
          ${frontPageHeadlines.slice(1, 5).map(h => `
            <div class="hl">
              <div class="cat">${h.sectionName}</div>
              ${h.imageUrl && !h.imageUrl.startsWith("data:") ? `<img src="${h.imageUrl}" alt="" style="width:100%;height:80px;object-fit:cover;margin-bottom:4px;" />` : ""}
              <h2>${h.title}</h2>
              <p>${(h.summary || "").slice(0, 120)}</p>
              <div class="hl-byline">By ${h.author} · <span style="color:#c41e1e;">p.${h.pageNo} →</span></div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="fp-rule"></div>

      <!-- Right sidebar: at a glance + more headlines + TOC at bottom -->
      <div class="fp-sidebar">
        ${glanceHTML}
        ${frontPageHeadlines.slice(5, 10).map(h => `
          <div class="hl">
            <div class="cat">${h.sectionName}</div>
            <h2>${h.title}</h2>
            <p>${(h.summary || "").slice(0, 80)} <span style="color:#c41e1e;font-size:7px;">→ p.${h.pageNo}</span></p>
          </div>
        `).join("")}

        ${qodHTML}

        <!-- Today's Paper TOC — vertical on right -->
        <div class="toc-vertical">
          <h3>Today's Paper</h3>
          ${allSections.map(s => {
            const pg = sectionStartPages[s] || 2;
            const count = sections[s]?.length || 0;
            return `<div class="toc-v-item"><span>${s} (${count})</span><span class="page-no">p.${pg}</span></div>`;
          }).join("")}
        </div>
      </div>
    </div>

    ${editorialHTML}

    <div class="page-footer">
      <span>LoktantraVani</span>
      <span>loktantravani.vercel.app</span>
      <span>Page 1 of ${totalPages}</span>
    </div>
  </div>`;

  // Section pages from plan (multi-page sections supported)
  const sectionPagesHTML = pagesPlan.map((plan, i) => {
    const pageNum = i + 2;
    const pageHTML = renderPage(plan.section, plan.articles, pageNum, totalPages, dateFormatted);
    // Insert ad after every 3rd page
    const showAd = i > 0 && i % 3 === 2;
    const adHtml = showAd ? renderAdSlot(adsData[Math.floor(i / 3) % Math.max(1, adsData.length)] || null) : "";
    return pageHTML + adHtml;
  }).join("");

  // Page navigation
  const navHTML = `
  <div class="nav-bar no-print">
    <span style="font-size:11px;letter-spacing:2px;">LoktantraVani E-Paper · ${dateFormatted}</span>
    <div class="pages">
      <a href="#page-0" class="active">Front</a>
      ${pagesPlan.map((p, i) => `<a href="#page-${i + 2}">${p.pageLabel}</a>`).join("")}
    </div>
    <div style="display:flex;gap:12px;">
      <button onclick="window.print()" style="background:#c41e1e;padding:6px 16px;">Print / Save PDF</button>
      <a href="/" style="padding:6px 0;">← Back</a>
    </div>
  </div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LoktantraVani E-Paper — ${dateFormatted}</title>
<style>${css}</style>
</head>
<body>
  ${navHTML}
  ${requestedPage === "1" || !requestedPage ? frontPageHTML : ""}
  ${!requestedPage ? sectionPagesHTML : ""}
  ${requestedPage && requestedPage !== "1" ? (() => {
    const idx = parseInt(requestedPage) - 2;
    const plan = pagesPlan[idx];
    return plan ? renderPage(plan.section, plan.articles, parseInt(requestedPage), totalPages, dateFormatted) : "<p>Page not found</p>";
  })() : ""}
  ${fillerScript()}
</body>
</html>`;

  const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
  if (download) headers["Content-Disposition"] = `attachment; filename="LoktantraVani-${dateParam}.html"`;
  return new NextResponse(html, { headers });
}
