import type { Locale } from "@/i18n/config";

/**
 * Which mosque this deployment belongs to, read from configuration at boot.
 *
 * Deliberately NOT a database entity. One deployment serves one mosque, and a
 * second mosque means a second deployment with a different environment. Real
 * multi-tenancy would put a foreign key on every table, scope every query,
 * and need per-mosque admin credentials, which collides with the one shared
 * password this app is built around. If it is ever wanted, it is a migration
 * from here, not a rewrite.
 *
 * The name matters on the public pages for a specific reason: a volunteer
 * reaches this site from a QR code on a poster and is asked to type a phone
 * number. "Khair" alone does not tell them whose form this is.
 */
export type MosqueIdentity = {
  /** Empty when unconfigured, in which case the pages show the wordmark alone. */
  name: string;
  /** A path under /public, or empty. Never a hotlink to someone else's server. */
  logoUrl: string;
};

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * The mosque's name in the reader's language, falling back to the configured
 * default. An unconfigured Arabic name shows the default rather than nothing:
 * the name of the place is more use to a reader than a blank, and it matches
 * the decision that admin-written content stays in one language.
 */
export function mosqueIdentity(locale: Locale): MosqueIdentity {
  const fallback = env("MOSQUE_NAME");
  const localised =
    locale === "ar" ? env("MOSQUE_NAME_AR") : locale === "fr" ? env("MOSQUE_NAME_FR") : "";

  return {
    name: localised || fallback,
    logoUrl: env("MOSQUE_LOGO"),
  };
}
