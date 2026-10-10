import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
import { notFound } from "next/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { mosqueIdentity } from "@/config/mosque";
import { isLocale, localeDir, locales } from "@/i18n/config";
import { messages } from "@/i18n/messages";
import { mottos } from "@/i18n/mottos";
import "../../globals.css";

// One family carries Latin and Arabic, so the page keeps its voice across a
// language switch instead of changing character with the script.
const body = IBM_Plex_Sans_Arabic({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const display = Outfit({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return { title: "Khair" };
  return {
    title: messages[locale].pageTitle,
    description: messages[locale].pageIntro,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = messages[locale];
  const mosque = mosqueIdentity(locale);

  return (
    <html lang={locale} dir={localeDir[locale]} className={`${body.variable} ${display.variable}`}>
      <body>
        <div className="shell">
          <header className="topbar">
            <a className="brand" href={`/${locale}`}>
              {mosque.logoUrl ? (
                // Decorative: the name sits right beside it as real text.
                <img className="brand-logo" src={mosque.logoUrl} alt="" width={36} height={36} />
              ) : null}
              <span className="brand-text">
                <span className="wordmark">Khair</span>
                {mosque.name ? <span className="brand-org">{mosque.name}</span> : null}
              </span>
            </a>
            <LocaleSwitcher current={locale} label={m.languageLabel} />
          </header>
          {children}

          {/* Why the app exists, in three texts that take turns.
              
              CSS only: everything else on these pages works with scripting
              switched off and a motto is the last thing that should be the
              exception. The three sit in one grid cell so the band neither
              grows nor moves the list above it, and the first is visible as
              the plain unanimated state, so where there is no animation
              there is still a motto. */}
          <footer className="motto">
            {mottos[locale].map((motto, index) => (
              <blockquote
                className="motto-item"
                key={motto.arabic}
                style={{ animationDelay: `${index * 8}s` }}
              >
                <p className="motto-arabic" lang="ar" dir="rtl">
                  {motto.arabic}
                </p>
                {motto.translation ? <p className="motto-said">{motto.translation}</p> : null}
                <cite className="motto-source">{motto.source}</cite>
              </blockquote>
            ))}
          </footer>
        </div>
      </body>
    </html>
  );
}
