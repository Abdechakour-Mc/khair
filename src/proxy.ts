import { NextResponse, type NextRequest } from "next/server";
import {
  LOCALE_COOKIE,
  PATH_HEADER,
  defaultLocale,
  isLocale,
  matchAcceptLanguage,
} from "@/i18n/config";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    // Tell server components the path they are rendering, so the language
    // switcher can offer the same page in another language.
    const headers = new Headers(request.headers);
    headers.set(PATH_HEADER, pathname);
    const response = NextResponse.next({ request: { headers } });

    // Visiting a language is the explicit choice. Remember it, so the bare
    // root goes here next time and auto-detection never overrides it again.
    if (request.cookies.get(LOCALE_COOKIE)?.value !== firstSegment) {
      response.cookies.set(LOCALE_COOKIE, firstSegment, {
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
      });
    }
    return response;
  }

  const remembered = request.cookies.get(LOCALE_COOKIE)?.value;
  const target = isLocale(remembered)
    ? remembered
    : matchAcceptLanguage(request.headers.get("accept-language")) ?? defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${target}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next's own assets and anything with a file extension.
  matcher: ["/((?!_next/|favicon|.*\\.).*)"],
};
