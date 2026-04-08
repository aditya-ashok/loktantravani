/**
 * GET /api/admin/article-pdf?id=xxx
 * Generates a newspaper-style shareable image card (HTML) for a single article
 * Includes QR code linking back to the original article
 * Can be screenshot/saved as HD image
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, queryByField } from "@/lib/firestore-rest";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const theme = req.nextUrl.searchParams.get("theme") || "premium"; // 'premium' or 'bjp-plus'
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const post = await getDoc(`posts/${id}`);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const title = (post.title as string) || "Untitled";
  const summary = (post.summary as string) || "";
  const content = (post.content as string) || "";
  const category = (post.category as string) || "India";
  const author = (post.author as string) || "LoktantraVani";
  const imageUrl = (post.imageUrl as string) || "";
  const slug = (post.slug as string) || id;
  const createdAt = (post.createdAt as string) || new Date().toISOString();

  const articleUrl = `https://loktantravani.vercel.app/blog/${slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(articleUrl)}&bgcolor=ffffff&color=1a1a1a`;

  // Strip HTML from content for plain text excerpt
  const plainContent = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const excerpt = theme === "premium" 
    ? (plainContent.slice(0, 1000) + (plainContent.length > 1000 ? "..." : ""))
    : (plainContent.slice(0, 400) + (plainContent.length > 400 ? "..." : ""));

  const date = new Date(createdAt).toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Category & Branding colors
  const catColors: Record<string, string> = {
    India: "#c41e1e", Politics: "#FF9933", Geopolitics: "#6c3483", Economy: "#1e8449",
    Sports: "#d35400", Tech: "#2c3e50", Defence: "#1b4f72", Opinion: "#7d3c98",
    Cities: "#117864", "West Asia": "#c0392b", World: "#2e4053", "Lok Post": "#e67e22",
  };
  const baseColor = theme === "bjp-plus" ? "#FF9933" : (catColors[category] || "#c41e1e");
  const catColor = baseColor;

  // Fetch Author detailed profile from "users" collection (uid-based)
  let authorProfile: any = null;
  const authorEmail = (post.authorEmail as string) || "";
  if (authorEmail) {
    const users = await queryByField("users", "email", authorEmail, 1);
    if (users && users.length > 0) authorProfile = users[0];
  }
  
  // Official Author Bios & Avatars mapping
  const officialProfiles: Record<string, { designation: string; bio: string; avatar: string }> = {
    "Aditya Vani": {
      designation: "Chief Editor, LoktantraVani",
      bio: "IIM Mumbai, IIIT Bangalore, Public Policy Consultant, 10+ years of Experience.",
      avatar: "https://ui-avatars.com/api/?name=Aditya+Vani&background=FF9933&color=fff&size=200&bold=true"
    },
    "Ashok Kumar Choudhary": {
      designation: "Editor-in-Chief",
      bio: "Veteran journalist with decades of experience in national policy and governance.",
      avatar: "https://ui-avatars.com/api/?name=Ashok+Kumar+Choudhary&background=FF9933&color=fff&size=200&bold=true"
    },
    "Sanjay Saraogi": {
      designation: "Managing Director",
      bio: "Strategic leader driving regional development and social narratives.",
      avatar: "https://ui-avatars.com/api/?name=Sanjay+Saraogi&background=FF9933&color=fff&size=200&bold=true"
    },
    "Adarsh Ashok": {
      designation: "Head of AI Operations",
      bio: "Leading the next frontier of automated journalism and digital truth.",
      avatar: "https://ui-avatars.com/api/?name=Adarsh+Ashok&background=FF9933&color=fff&size=200&bold=true"
    },
    "Seema Choudhary": {
      designation: "Cultural Analyst",
      bio: "Deep explorer of Neo Bharat's social and cultural evolution.",
      avatar: "https://ui-avatars.com/api/?name=Seema+Choudhary&background=FF9933&color=fff&size=200&bold=true"
    },
    "Shreya Rahul Anand": {
      designation: "Fact-Check Lead",
      bio: "Guardian of editorial integrity and data accuracy in the AI era.",
      avatar: "https://ui-avatars.com/api/?name=Shreya+Rahul+Anand&background=FF9933&color=fff&size=200&bold=true"
    },
    "BJP+ Social": {
      designation: "AI Political Correspondent",
      bio: "Automated agent curating the national development narrative.",
      avatar: "https://ui-avatars.com/api/?name=BJP+Social&background=FF9933&color=fff&size=200&bold=true"
    }
  };

  const official = officialProfiles[author];
  const authorPhoto = official?.avatar || authorProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=FF9933&color=fff&size=100&bold=true`;
  const authorDesignation = official?.designation || authorProfile?.designation || "LoktantraVani Correspondent";
  const authorBio = official?.bio || authorProfile?.bio || "Experienced journalist covering national and global affairs.";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=1080" />
<title>${title} — LoktantraVani</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Serif+4:wght@400;600;700&family=Bangers&display=swap" rel="stylesheet" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f0f0f0; display: flex; justify-content: center; padding: 20px; font-family: 'Source Serif 4', Georgia, serif; }

  .card {
    width: 1080px; height: 1350px; 
    background: ${theme === 'bjp-plus' || theme === 'lok-post' ? '#fff9f3' : '#ffffff'};
    border: 3px solid ${theme === 'bjp-plus' || theme === 'lok-post' ? '#FF9933' : '#1a1a1a'}; 
    position: relative; overflow: hidden;
    display: flex; flex-direction: column;
    margin: 0 auto;
    box-shadow: 0 0 50px rgba(0,0,0,0.1);
  }

  /* Masthead */
  .masthead {
    padding: 20px 40px 16px; border-bottom: 3px solid #1a1a1a;
    display: flex; align-items: baseline; justify-content: space-between;
  }
  .masthead-title { font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 900; letter-spacing: -1px; color: ${theme === 'bjp-plus' ? '#FF9933' : '#1a1a1a'}; }
  .masthead-title span { color: ${theme === 'bjp-plus' ? '#1a1a1a' : catColor}; }
  .masthead-meta { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 2px; text-align: right; }

  /* Category bar */
  .cat-bar {
    background: ${catColor}; color: white; padding: 8px 40px;
    font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 4px;
    display: flex; justify-content: space-between; align-items: center;
  }

  /* Hero image */
  .hero-img {
    width: 100%; height: ${theme === 'bjp-plus' ? '550px' : '450px'}; object-fit: cover; display: block;
    border-bottom: 2px solid #1a1a1a;
    ${theme === 'bjp-plus' ? 'filter: contrast(1.1) saturate(1.2);' : ''}
  }

  /* Content area */
  .content-area { 
    padding: 30px 40px; 
    flex: 1; /* Pushes footer to bottom */
    display: flex;
    flex-direction: column;
  }

  .headline {
    font-family: ${theme === 'bjp-plus' ? "'Bangers', cursive" : "'Playfair Display', serif"}; 
    font-size: ${theme === 'bjp-plus' ? '72px' : '48px'}; 
    font-weight: 900;
    line-height: 0.95; letter-spacing: ${theme === 'bjp-plus' ? '1px' : '-1.5px'}; 
    margin-bottom: 12px; color: #1a1a1a;
  }

  .summary {
    font-size: 18px; color: #444; line-height: 1.6; margin-bottom: 16px;
    font-style: italic; border-left: 4px solid ${catColor}; padding-left: 16px;
  }

  .author-section {
    display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
    padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;
  }
  .author-photo { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; border: 2px solid ${catColor}; }
  .author-info { flex: 1; }
  .author-name { font-size: 16px; font-weight: 800; color: #1a1a1a; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .author-bio { font-size: 11px; color: #666; line-height: 1.4; max-width: 450px; }

  .excerpt {
    font-size: ${theme === 'bjp-plus' ? '19px' : '13px'}; 
    line-height: ${theme === 'bjp-plus' ? '1.5' : '1.55'}; 
    color: #333; 
    column-count: ${theme === 'bjp-plus' ? '1' : '3'}; 
    column-gap: 24px;
    column-rule: 1px solid #e0e0e0; text-align: justify; hyphens: auto;
  }

  /* Footer with QR */
  .footer {
    border-top: 3px solid #1a1a1a; background: #fafafa;
    padding: 24px 40px; display: flex; align-items: center; justify-content: space-between;
    margin-top: auto; /* Safety push */
    z-index: 50;
  }
  .footer-left { }
  .footer-text { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #999; }
  .footer-url { font-size: 9px; color: ${catColor}; letter-spacing: 1px; margin-top: 4px; word-break: break-all; }
  .footer-tagline { font-size: 11px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
  .qr-section { text-align: center; }
  .qr-section { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .qr-label { font-size: 8px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 4px; }

  /* 2x2 Grid for Lok Post */
  .grid-2x2 {
    display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr;
    height: 800px; gap: 20px; padding: 20px; background: #fff9f3;
  }
  .grid-item {
    border: 2px solid #FF9933; padding: 20px; display: flex; flex-direction: column;
    justify-content: center; position: relative; background: white;
  }
  .grid-headline { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; line-height: 1.2; color: #1a1a1a; }
  .grid-tag { font-size: 9px; font-weight: 900; color: #FF9933; text-transform: uppercase; margin-bottom: 8px; }
  .center-qr {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; border: 4px solid #FF9933; padding: 10px; z-index: 10;
  }

  /* Download hint */
  .download-hint {
    position: fixed; bottom: 10px; right: 10px; background: #1a1a1a; color: white;
    padding: 8px 16px; font-size: 11px; font-family: sans-serif; border-radius: 4px;
    cursor: pointer; z-index: 999;
  }
  .download-hint:hover { background: ${catColor}; }

  @media print { .download-hint { display: none; } body { padding: 0; } }
</style>
</head>
<body>
  <div class="card" id="card">
    <!-- Masthead -->
    <div class="masthead">
      <div class="masthead-title">${theme === 'lok-post' ? 'Big 4 <span>Vibes</span>' : 'Loktantra<span>Vani</span>'}</div>
      <div class="masthead-meta">
        ${date}<br/>${theme === 'lok-post' ? 'No Cap News of the Day' : 'India\'s First AI Newspaper'}
      </div>
    </div>

    ${theme === 'lok-post' ? `
      <div style="padding: 10px 40px; font-size: 14px; font-weight: 900; background: #FF9933; color: white; text-align: center; letter-spacing: 2px;">
        TODAY'S MAIN CHARACTER ENERGY
      </div>
      <div style="position: relative; flex: 1;">
         <div class="grid-2x2">
            <div class="grid-item"><span class="grid-tag">Slays</span><h2 class="grid-headline">${title}</h2></div>
            <div class="grid-item"><span class="grid-tag">Absolute W</span><h2 class="grid-headline">UPI Global Dominance Hits New Peak</h2></div>
            <div class="grid-item"><span class="grid-tag">Glow Up</span><h2 class="grid-headline">Vande Bharat 2.0 is Serving Looks</h2></div>
            <div class="grid-item"><span class="grid-tag">Aura +1000</span><h2 class="grid-headline">India's Semi-conductor Mission is Cracked</h2></div>
         </div>
         <div class="center-qr">
            <img src="${qrUrl}" alt="QR" width="80" height="80" />
            <p style="font-size: 7px; text-align: center; margin-top: 4px; font-weight: 900;">SCAN FOR TEA</p>
         </div>
      </div>
    ` : `
      <!-- Category -->
      <div class="cat-bar">
        <span>${category.toUpperCase()}</span>
        <span style="letter-spacing:1px;font-size:10px;">loktantravani.vercel.app</span>
      </div>

      <!-- Hero Image -->
      ${imageUrl ? `<img class="hero-img" src="${imageUrl.startsWith('data:') ? imageUrl : `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`}" alt="${title}" crossorigin="anonymous" />` : ""}

      <!-- Content -->
      <div class="content-area">
        <h1 class="headline" style="${theme === 'bjp-plus' ? 'font-size: 56px; line-height: 1; margin-bottom: 24px;' : ''}">${title}</h1>
        ${theme !== 'bjp-plus' && summary ? `<p class="summary">${summary}</p>` : ""}
        
        <div class="author-section" style="${theme === 'bjp-plus' ? 'margin-bottom: 30px;' : ''}">
          <img class="author-photo" src="${authorPhoto.startsWith('data:') ? authorPhoto : `/api/proxy-image?url=${encodeURIComponent(authorPhoto)}`}" alt="${author}" crossorigin="anonymous" />
          <div class="author-info">
            <p class="author-name">${author}</p>
            <p class="author-bio"><strong>${authorDesignation}</strong></p>
          </div>
        </div>

        <div class="excerpt">${theme === 'bjp-plus' ? excerpt.slice(0, 300) + "..." : excerpt}</div>
      </div>
    `}

    <!-- Footer with QR -->
    <div class="footer">
      <div class="footer-left">
        <p class="footer-tagline">LoktantraVani — India's First AI Newspaper</p>
        <p class="footer-text">Scan QR to read full article</p>
        <p class="footer-url">${articleUrl}</p>
      </div>
      <div class="qr-section">
        <p class="qr-label">Read Full Article</p>
        <img src="${qrUrl}" alt="QR Code" width="100" height="100" />
      </div>
    </div>
  </div>

  <div class="download-hint" onclick="window.print()">📥 Save as Image (Ctrl+P → Save as PDF → Screenshot)</div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=3600",
    },
  });
}
