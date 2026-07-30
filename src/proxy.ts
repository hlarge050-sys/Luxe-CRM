import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await verifySessionToken(token).catch(() => false);

  if (pathname === "/login") {
    return authed
      ? NextResponse.redirect(new URL("/", req.url))
      : NextResponse.next();
  }
  return authed
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/((?!_next|api/health|.*\\..*).*)"],
};
