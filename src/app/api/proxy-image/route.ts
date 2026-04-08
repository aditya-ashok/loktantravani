import { NextRequest, NextResponse } from "next/server";

const BLOCKED_DOMAINS = [
  "metadata.google.internal",
  "169.254.169.254",
];

const MAX_RESPONSE_SIZE = 10 * 1024 * 1024; // 10MB

function isPrivateHostname(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return true;
  }

  // Check IP-based hostnames
  const parts = hostname.split(".");
  if (parts.length === 4 && parts.every((p) => /^\d+$/.test(p))) {
    const a = parseInt(parts[0]);
    const b = parseInt(parts[1]);
    if (a === 10) return true; // 10.x.x.x
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16-31.x.x
    if (a === 192 && b === 168) return true; // 192.168.x.x
    if (a === 127) return true; // 127.x.x.x
    if (a === 169 && b === 254) return true; // 169.254.x.x
    if (a === 0) return true; // 0.x.x.x
  }

  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("No URL", { status: 400 });

  // Validate URL format
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Only allow HTTPS
  if (parsed.protocol !== "https:") {
    return new NextResponse("Only HTTPS URLs are allowed", { status: 400 });
  }

  // Block private/internal IPs
  if (isPrivateHostname(parsed.hostname)) {
    return new NextResponse("Private/internal URLs are not allowed", { status: 403 });
  }

  // Block cloud metadata endpoints
  if (BLOCKED_DOMAINS.includes(parsed.hostname)) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Fetch failed");

    // Validate content-type is an image
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Response is not an image", { status: 400 });
    }

    // Check content-length header first (if available)
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return new NextResponse("Image too large (max 10MB)", { status: 413 });
    }

    const arrayBuffer = await res.arrayBuffer();

    // Enforce max size on actual body
    if (arrayBuffer.byteLength > MAX_RESPONSE_SIZE) {
      return new NextResponse("Image too large (max 10MB)", { status: 413 });
    }

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}
