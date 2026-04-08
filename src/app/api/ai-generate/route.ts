/**
 * POST /api/ai-generate
 * AI Article & Cartoon Generation Router
 * Uses unified AI Generator service
 */

import { NextRequest, NextResponse } from "next/server";
import { 
  generateArticle, 
  generateCartoonConcept, 
  generateImage 
} from "@/lib/ai-generator";

const STOCK_IMAGES: Record<string, string[]> = {
  Politics: [
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541872703-74c5e443d1fe?q=80&w=2038&auto=format&fit=crop",
  ],
  "Lok Post": [
    "https://images.unsplash.com/photo-1580133312324-2c3e1e796bc9?q=80&w=2070&auto=format&fit=crop"
  ]
};

function getStockImageUrl(category: string, topic: string) {
  const imgs = STOCK_IMAGES[category] || STOCK_IMAGES.Politics;
  const hash = topic.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return imgs[hash % imgs.length];
}

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "loktantravani-2d159.firebasestorage.app";

/** Upload a base64 data URL to Firebase Storage and return a permanent URL */
async function uploadDataUrlToStorage(dataUrl: string): Promise<string | null> {
  try {
    const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) return null;
    const [, ext, b64] = match;
    const buffer = Buffer.from(b64, "base64");
    const filename = `articles/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(filename)}?uploadType=media`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": `image/${ext}` },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      console.error("Storage upload failed:", await res.text());
      return null;
    }

    const data = await res.json();
    return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(data.name)}?alt=media&token=${data.downloadTokens || ""}`;
  } catch (e) {
    console.error("Image upload error:", e);
    return null;
  }
}

/** Convert a data URL to a permanent storage URL, or return as-is if already a URL */
async function resolveImageUrl(imageUrl: string | null, fallbackUrl: string): Promise<{ storageUrl: string; displayUrl: string }> {
  if (!imageUrl) return { storageUrl: fallbackUrl, displayUrl: fallbackUrl };
  if (!imageUrl.startsWith("data:")) return { storageUrl: imageUrl, displayUrl: imageUrl };
  // Upload data URL to Firebase Storage
  const uploaded = await uploadDataUrlToStorage(imageUrl);
  return {
    storageUrl: uploaded || fallbackUrl,
    displayUrl: uploaded || imageUrl, // show AI image in preview even if upload fails
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, topic, style, tone, language, wordCount, category, author } = body;

    // 0. Image-only regeneration (for edit article)
    if (type === "image-only") {
      const imageUrl = await generateImage(topic);
      const fallbackUrl = getStockImageUrl(category || "India", topic);
      const { storageUrl, displayUrl } = await resolveImageUrl(imageUrl, fallbackUrl);
      return NextResponse.json({ success: true, imageUrl: storageUrl || displayUrl });
    }

    // 1. Trending Topics (Simple prompt, no separate service needed)
    if (type === "trending-topics") {
       return NextResponse.json({ topics: ["Article 1", "Article 2"] }); // Placeholder or reuse lib
    }

    // 2. Twitter Trending / Impact Analysis
    if (type === "twitter-trending") {
      const parsed = await generateArticle(topic, "Politics", "en", "nationalist", 500);
      const aiImageUrl = await generateImage(parsed.imagePrompt);
      const stockUrl = getStockImageUrl("Politics", topic);
      const { storageUrl, displayUrl } = await resolveImageUrl(aiImageUrl, stockUrl);

      let savedId: string | null = null;
      try {
        const { createDoc, generateSlug } = await import("@/lib/firestore-rest");
        savedId = await createDoc("posts", {
          title: parsed.headline,
          titleHi: parsed.headlineHi,
          slug: generateSlug(parsed.headline),
          summary: parsed.summary,
          content: parsed.content,
          category: "Politics",
          section: "Main Feed",
          author: author || "BJP+ Social",
          authorRole: "agent",
          imageUrl: storageUrl,
          status: "draft",
          language: language || "en",
          tags: ["bjp-plus", "trending", topic.toLowerCase().replace(/\s+/g, "-")],
          readingTimeMin: 3,
          viewCount: 0,
          reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
        });
      } catch (e) {
        console.warn("Draft queue failed:", e);
      }

      return NextResponse.json({ 
        success: true, 
        result: { ...parsed, imageUrl: displayUrl },
        savedId
      });
    }

    // 3. Cartoon Generation
    if (type === "cartoon") {
      const parsed = await generateCartoonConcept(topic, style || "political-satire");
      const cartoonImageUrl = await generateImage(parsed.imagePrompt);
      const fallbackUrl = getStockImageUrl("Lok Post", parsed.headline);
      const { storageUrl: cartoonStorageUrl, displayUrl: cartoonDisplayUrl } = await resolveImageUrl(cartoonImageUrl, fallbackUrl);

      let savedId: string | null = null;
      try {
        const { createDoc, generateSlug } = await import("@/lib/firestore-rest");
        savedId = await createDoc("posts", {
          title: parsed.headline,
          titleHi: parsed.headlineHi,
          slug: generateSlug(parsed.headline),
          summary: parsed.caption,
          content: `<p>${parsed.caption}</p>`,
          category: "Lok Post",
          section: "Main Feed",
          author,
          authorRole: "agent",
          imageUrl: cartoonStorageUrl,
          status: "draft",
          tags: ["lok-post", "ai-generated", topic.toLowerCase().replace(/\s+/g, "-")],
          readingTimeMin: 2,
          viewCount: 0,
          reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
        });
      } catch (e) {
        console.warn("Save failed:", e);
      }

      return NextResponse.json({
        success: true,
        type: "cartoon",
        result: { ...parsed, hasImage: !!cartoonImageUrl, imageUrl: cartoonDisplayUrl },
        savedId,
      });
    }

    // 4. Standard Article Generation
    if (type === "article") {
      const parsed = await generateArticle(topic, category, language, tone, wordCount);
      const articleImageUrl = await generateImage(parsed.imagePrompt);
      const fallbackUrl = getStockImageUrl(category, parsed.headline);

      // Upload data URL to Firebase Storage for permanent URL
      const { storageUrl, displayUrl } = await resolveImageUrl(articleImageUrl, fallbackUrl);

      const { createDoc, generateSlug } = await import("@/lib/firestore-rest");
      let savedId: string | null = null;
      let saveError: string | null = null;
      try {
        savedId = await createDoc("posts", {
          title: parsed.headline,
          titleHi: parsed.headlineHi || "",
          slug: generateSlug(parsed.headline),
          summary: parsed.summary || "",
          summaryHi: "",
          category: category || "India",
          section: "Main Feed",
          author: author || "LoktantraVani AI",
          authorRole: "agent",
          language: language || "en",
          imageUrl: storageUrl,
          status: "draft",
          content: parsed.content || "",
          contentHi: "",
          tags: [(category || "india").toLowerCase().replace(/\s+/g, "-"), "ai-generated"],
          readingTimeMin: Math.ceil((wordCount || 1500) / 200),
          viewCount: 0,
          reactions: { fire: 0, india: 0, bulb: 0, clap: 0 },
          isBreaking: false,
        });
      } catch (e) {
        saveError = String(e);
        console.error("Firestore save failed:", e);
      }

      return NextResponse.json({
        success: !!savedId,
        type: "article",
        result: { ...parsed, imageUrl: displayUrl },
        savedId,
        saveError,
      });
    }

    // 5. Chat (VaniBot)
    if (type === "chat") {
      const { messages } = body;
      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: "Messages required" }, { status: 400 });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ result: "Sorry, AI service is not configured." });
      }
      // Convert messages to Gemini format (must start with user turn)
      const systemMsg = messages.find((m: { role: string }) => m.role === "system");
      const chatMsgs = messages.filter((m: { role: string }) => m.role !== "system");
      // Gemini requires first message to be "user" — skip leading assistant messages
      const firstUserIdx = chatMsgs.findIndex((m: { role: string }) => m.role === "user");
      const validMsgs = firstUserIdx >= 0 ? chatMsgs.slice(firstUserIdx) : chatMsgs;
      const contents = validMsgs.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
      return NextResponse.json({ result: reply });
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });

  } catch (error) {
    console.error("AI Generate Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
