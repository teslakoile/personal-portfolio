import { NextResponse, type NextRequest } from "next/server";

const CV = "/Kyle-Naranjo-CV.pdf";

/**
 * Bing indexed a lowercase copy of the CV link, which 404s. A next.config
 * redirect cannot fix it: its matching ignores case, so the real path would
 * redirect to itself. The exact comparison keeps the real file safe if the
 * matcher ever ignores case as well.
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === CV) return NextResponse.next();
  return NextResponse.redirect(new URL(CV, request.url), 308);
}

export const config = {
  matcher: "/kyle-naranjo-cv.pdf",
};
