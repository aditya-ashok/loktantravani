/**
 * POST /api/react
 * Increment a reaction on a post
 * Body: { postId: string, reaction: "fire" | "india" | "bulb" | "clap" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getDoc, setDoc } from "@/lib/firestore-rest";

export async function POST(req: NextRequest) {
  try {
    const { postId, reaction } = await req.json();
    if (!postId || !reaction) {
      return NextResponse.json({ error: "postId and reaction required" }, { status: 400 });
    }

    const validReactions = ["fire", "india", "bulb", "clap"];
    if (!validReactions.includes(reaction)) {
      return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });
    }

    // Get current reactions
    const post = await getDoc(`posts/${postId}`);
    const reactions = (post?.reactions as Record<string, number>) || { fire: 0, india: 0, bulb: 0, clap: 0 };
    reactions[reaction] = (reactions[reaction] || 0) + 1;

    await setDoc(`posts/${postId}`, { reactions });

    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
