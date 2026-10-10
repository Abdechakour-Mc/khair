import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors";
import { formatPhoneForDisplay, normalizePhone, whatsappHref } from "@/core/phone";

describe("normalising a phone number", () => {
  it("reads a bare local number as Canadian", () => {
    expect(normalizePhone("5142849137")).toBe("+15142849137");
  });

  it("resolves the same number written several ways to one identity", () => {
    const forms = [
      "5142849137",
      "514-284-9137",
      "(514) 284-9137",
      "514 284 9137",
      "+1 514 284 9137",
      "+15142849137",
      "1-514-284-9137",
    ];
    const normalised = new Set(forms.map((form) => normalizePhone(form)));
    expect([...normalised]).toEqual(["+15142849137"]);
  });

  it("keeps an explicit international number as it was given", () => {
    expect(normalizePhone("+33 6 12 34 56 78")).toBe("+33612345678");
  });

  it("honours a different configured country for bare local numbers", () => {
    expect(normalizePhone("0612345678", "FR")).toBe("+33612345678");
  });

  it("refuses an empty number", () => {
    expect(() => normalizePhone("   ")).toThrow(ValidationError);
  });

  it("refuses something that is not a phone number", () => {
    expect(() => normalizePhone("not a phone")).toThrow(ValidationError);
    expect(() => normalizePhone("12345")).toThrow(ValidationError);
  });

  it("names the field it objects to, so the form can show it in place", () => {
    try {
      normalizePhone("nope");
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe("phone");
    }
  });
});

describe("showing a phone number to the Admin", () => {
  it("formats it the way the Admin would read it aloud", () => {
    expect(formatPhoneForDisplay("+15142849137")).toBe("(514) 284-9137");
  });

  it("builds a WhatsApp link that is one tap from a nudge", () => {
    expect(whatsappHref("+15142849137")).toBe("https://wa.me/15142849137");
  });
});
