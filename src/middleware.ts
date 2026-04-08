import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const isHindi = hostname.startsWith("hindi.");

  if (isHindi) {
    // Set a cookie/header so the app knows to render in Hindi
    const response = NextResponse.next();
    response.headers.set("x-lang", "hi");
    response.cookies.set("lang", "hi", { path: "/" });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|icon|manifest|og-image|apple-touch).*)"],
};
