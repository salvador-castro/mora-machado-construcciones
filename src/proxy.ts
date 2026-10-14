import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";
import { publicSlugExists, type DetailSection } from "@/lib/content/exists";

const DETAIL_RE = /^\/(servicios|obras|blog)\/([^/]+)\/?$/;
/** Draft Mode cookie (admin preview of unpublished items). */
const DRAFT_COOKIE = "__prerender_bypass";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const detail = DETAIL_RE.exec(pathname);
  if (detail) return detailGuard(request, detail[1] as DetailSection, detail[2]!);
  return adminGuard(request);
}

/**
 * Detail pages stream, so once rendering starts the status is already 200 and
 * notFound() can only produce a soft 404. Unknown/unpublished slugs are answered
 * here, before rendering, with a real 404 (rewrite to an unmatched path).
 */
async function detailGuard(request: NextRequest, section: DetailSection, slug: string) {
  if (request.cookies.has(DRAFT_COOKIE)) return NextResponse.next();
  let decoded = "";
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // malformed escape → not found
  }
  if (decoded && (await publicSlugExists(section, decoded))) return NextResponse.next();
  // Behind Nginx this only stays an internal rewrite if the request is plain
  // http: Nginx must NOT send X-Forwarded-Proto (see deploy/nginx/mora.conf).
  const url = request.nextUrl.clone();
  url.pathname = "/404";
  return NextResponse.rewrite(url);
}

/**
 * Optimistic auth check for /admin (JWT only, no DB). The real check —
 * session row + active user + role — runs in requireUser() on every page/action.
 */
async function adminGuard(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims && !isLogin) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (claims && isLogin) {
    // Token valid but session revoked/expired server-side → clear it and show login.
    if (request.nextUrl.searchParams.has("expired")) {
      const res = NextResponse.next();
      res.cookies.delete(SESSION_COOKIE);
      return res;
    }
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/servicios/:slug", "/obras/:slug", "/blog/:slug"],
};
