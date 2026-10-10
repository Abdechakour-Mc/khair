export const locales = ["en", "ar", "fr"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** The cookie that remembers an explicit choice. Auto-detection never overrides it. */
export const LOCALE_COOKIE = "khair-locale";

/** Set by middleware so server components can build locale-swapped links. */
export const PATH_HEADER = "x-khair-path";

export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  fr: "ltr",
};

/** What the switcher shows. Each language names itself. */
export const localeLabel: Record<Locale, string> = {
  en: "EN",
  ar: "عربي",
  fr: "FR",
};

/**
 * Locales for Intl formatting. Canadian variants because that is where the
 * mosque is; `ar-u-nu-latn` keeps Latin digits in the Arabic view, which is
 * easier for a congregation that reads times off a phone in either script.
 */
export const formattingLocale: Record<Locale, string> = {
  en: "en-CA",
  ar: "ar-u-nu-latn",
  fr: "fr-CA",
};

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (locales as readonly string[]).includes(value);
}

/** Days are grouped in the mosque's own timezone, not the server's. */
export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || "America/Toronto";
}

/** Picks a locale from an Accept-Language header. Used on a first visit only. */
export function matchAcceptLanguage(header: string | null): Locale | undefined {
  if (!header) return undefined;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="))
        ?.slice(2);
      const quality = q === undefined ? 1 : Number.parseFloat(q);
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return undefined;
}
