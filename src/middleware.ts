import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const protectedPaths = ["/dashboard", "/onboarding", "/metrics", "/account"];
  const needsAuth = protectedPaths.some((p) => pathname.startsWith(p));

  if (needsAuth && !req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/metrics/:path*", "/account/:path*"],
};
