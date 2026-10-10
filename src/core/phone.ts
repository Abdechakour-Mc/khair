import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { ValidationError } from "./errors";

/**
 * Khair identifies a Volunteer by phone number, so normalisation is not
 * cosmetic: the same number written two ways must resolve to one person, or a
 * Volunteer's history silently splits in half.
 *
 * The country that bare local numbers are read as is configuration, because
 * changing it later splits every existing Volunteer in two.
 */
export function defaultPhoneCountry(): CountryCode {
  return (process.env.DEFAULT_PHONE_COUNTRY || "CA") as CountryCode;
}

/** Normalises anything a congregant might type into E.164, or explains why not. */
export function normalizePhone(input: string, country: CountryCode = defaultPhoneCountry()): string {
  const raw = (input ?? "").trim();
  if (!raw) throw new ValidationError("phone", "phone_required", "Enter a phone number.");

  const parsed = parsePhoneNumberFromString(raw, country);
  if (!parsed || !parsed.isValid()) {
    throw new ValidationError("phone", "phone_invalid", "That does not look like a phone number.");
  }

  // Mobile and fixed-line-or-mobile are both fine: plenty of people give a
  // landline. What we refuse is a premium-rate or obviously wrong number,
  // which isValid() already covers.
  return parsed.number;
}

/** For display back to the Admin: "(514) 555-0101" rather than "+15145550101". */
export function formatPhoneForDisplay(e164: string): string {
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatNational() : e164;
}

/** The href that opens WhatsApp for a number, used in the Admin view. */
export function whatsappHref(e164: string): string {
  return `https://wa.me/${e164.replace(/\D/g, "")}`;
}
