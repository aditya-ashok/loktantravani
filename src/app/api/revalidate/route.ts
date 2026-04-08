/**
 * POST /api/revalidate
 * On-demand ISR revalidation — purge cached pages so new articles appear immediately
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { paths } = await req.json().catch(() => ({ paths: ["/"] }));
    const revalidated: string[] = [];

    for (const path of (paths || ["/"])) {
      revalidatePath(path);
      revalidated.push(path);
    }

    return NextResponse.json({ revalidated, success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
