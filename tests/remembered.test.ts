import { describe, expect, it } from "vitest";
import { readRememberedVolunteer, rememberVolunteer } from "@/core/remembered";

const YUSUF = { name: "Yusuf Benali", phone: "+15142849137" };

describe("what a device remembers about the person using it", () => {
  it("comes back as it went in", () => {
    expect(readRememberedVolunteer(rememberVolunteer(YUSUF))).toEqual(YUSUF);
  });

  it("is nothing at all on a device that never signed up", () => {
    expect(readRememberedVolunteer(undefined)).toBeNull();
    expect(readRememberedVolunteer("")).toBeNull();
  });

  it("is nothing when the cookie is damaged", () => {
    expect(readRememberedVolunteer("not json")).toBeNull();
    expect(readRememberedVolunteer("[1,2,3]")).toBeNull();
    expect(readRememberedVolunteer("null")).toBeNull();
  });

  it("needs both halves, because half a form is worse than none", () => {
    expect(readRememberedVolunteer(JSON.stringify({ name: "Yusuf" }))).toBeNull();
    expect(readRememberedVolunteer(JSON.stringify({ phone: "+15142849137" }))).toBeNull();
    expect(readRememberedVolunteer(JSON.stringify({ name: "   ", phone: "+15142849137" }))).toBeNull();
  });

  it("refuses a number that is not E.164, since that is what the core stores", () => {
    expect(readRememberedVolunteer(JSON.stringify({ name: "Yusuf", phone: "514-284-9137" }))).toBeNull();
    expect(readRememberedVolunteer(JSON.stringify({ name: "Yusuf", phone: "+0" }))).toBeNull();
  });

  it("refuses values that are not strings at all", () => {
    expect(readRememberedVolunteer(JSON.stringify({ name: 42, phone: "+15142849137" }))).toBeNull();
    expect(
      readRememberedVolunteer(JSON.stringify({ name: "Yusuf", phone: { toString: 1 } })),
    ).toBeNull();
  });

  it("keeps a crafted cookie small rather than trusting its length", () => {
    const remembered = readRememberedVolunteer(
      JSON.stringify({ name: "a".repeat(5000), phone: YUSUF.phone }),
    );
    expect(remembered?.name.length).toBe(80);
  });

  it("stores the latest name against the same number, so a correction sticks", () => {
    // One phone number is one person: the number is the identity, and the
    // name is whatever they last told us.
    const corrected = { name: "Yusuf B.", phone: YUSUF.phone };
    expect(readRememberedVolunteer(rememberVolunteer(corrected))).toEqual(corrected);
  });

  it("holds a name in any script", () => {
    const khadija = { name: "خديجة العمراني", phone: "+14382017744" };
    expect(readRememberedVolunteer(rememberVolunteer(khadija))).toEqual(khadija);
  });
});
