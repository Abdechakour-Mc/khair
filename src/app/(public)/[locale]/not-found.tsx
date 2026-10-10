import { defaultLocale, isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";

export default async function NotFound() {
  // A not-found page cannot read route params, so it answers in the default
  // language. Every other page is locale-aware.
  const locale = isLocale(defaultLocale) ? defaultLocale : "en";
  const m = messages[locale];

  return (
    <div className="empty">
      <h2>{m.notFoundTitle}</h2>
      <p>{m.notFoundBody}</p>
    </div>
  );
}
