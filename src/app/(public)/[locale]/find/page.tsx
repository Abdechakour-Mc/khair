import { notFound } from "next/navigation";
import { FindSignupForm } from "@/components/FindSignupForm";
import { isLocale } from "@/i18n/config";
import { messages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

/**
 * The way back for somebody who closed the tab.
 *
 * Deliberately not a page that lists a person's Signups from a phone number
 * alone: that was ruled out early and stays ruled out, because numbers here
 * are unverified and anybody who knew a congregant's number could then see
 * and cancel their commitments. This takes the code and the number together
 * and opens exactly one Signup.
 */
export default async function FindSignup({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const m = messages[locale];

  return (
    <>
      <p className="backlink">
        <a href={`/${locale}`}>{m.backToList}</a>
      </p>

      <div className="masthead">
        <h1>{m.findTitle}</h1>
        <p>{m.findIntro}</p>
      </div>

      <FindSignupForm
        locale={locale}
        labels={{
          findCodeLabel: m.findCodeLabel,
          findCodeHint: m.findCodeHint,
          phoneLabel: m.phoneLabel,
          findPhoneHint: m.findPhoneHint,
          findSubmit: m.findSubmit,
          findSearching: m.findSearching,
          findNothing: m.findNothing,
        }}
      />
    </>
  );
}
