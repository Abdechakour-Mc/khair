/**
 * A dynamic route segment, decoded, without trusting it to be decodable.
 *
 * Next hands a dynamic param over still percent-encoded, verified against
 * Next 16: `/admin/volunteers/%2B15142849137` arrives as the literal
 * `%2B15142849137`, and so does the same URL typed with a bare `+`. So the
 * decode is necessary, and a page that skips it queries on a string no
 * Volunteer has and reports "no signups on record" for somebody who has
 * plenty.
 *
 * It is also not safe to assume the segment is valid encoding. A crafted
 * `/admin/volunteers/%` is not, and `decodeURIComponent` throws a URIError on
 * it, which is an untranslated 500 for the signed-in Admin. A segment that
 * cannot be decoded is kept as it stands: it will match nothing, which is the
 * correct answer for a URL nobody legitimately produced.
 */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
