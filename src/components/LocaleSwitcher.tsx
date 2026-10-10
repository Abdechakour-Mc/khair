import { headers } from "next/headers";
import { PATH_HEADER, localeLabel, locales, type Locale } from "@/i18n/config";

/**
 * Three plain text labels, present on every page, marking the current one.
 * Rendered on the server: no client JavaScript, so it works on an old phone
 * and before anything hydrates.
 */
export async function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const requestHeaders = await headers();
  const path = requestHeaders.get(PATH_HEADER) ?? `/${current}`;

  // Swap the locale segment, keep the rest of the page, so switching language
  // does not throw the reader back to the front page.
  const rest = path.replace(/^\/[^/]*/, "");

  return (
    <nav className="langs" aria-label={label}>
      {locales.map((locale) => (
        <a
          key={locale}
          href={`/${locale}${rest}`}
          hrefLang={locale}
          lang={locale}
          aria-current={locale === current ? "page" : undefined}
        >
          {localeLabel[locale]}
        </a>
      ))}
    </nav>
  );
}
