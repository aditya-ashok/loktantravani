import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = (process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const { url, body } = await req.json();
  if (!url || !body) {
    return NextResponse.json({ error: "Missing url or body" }, { status: 400 });
  }

  if (!url.startsWith("https://api.openai.com/")) {
    return NextResponse.json({ error: "Invalid API URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "OpenAI proxy request failed" }, { status: 500 });
  }
}
