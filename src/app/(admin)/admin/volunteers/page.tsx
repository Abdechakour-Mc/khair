import { AdminNav } from "@/components/AdminNav";
import { formatPhoneForDisplay } from "@/core/phone";
import { listVolunteers } from "@/core/volunteers";
import { appTimeZone } from "@/i18n/config";
import { formatShortDate } from "@/view/format";
import { requireAdminSession } from "../session";

export const dynamic = "force-dynamic";

/**
 * Everybody who has ever signed up.
 *
 * Khair has no accounts to manage, which is a deliberate choice and not a
 * gap: a Volunteer holds no password and no login, and their phone number is
 * their identity. So this is the list of people, and it exists to answer the
 * two questions an Admin actually has. Who turns up. And who has asked to be
 * forgotten, so their record can be found.
 *
 * A list and never a ranking: no score, no ordering by who helps most, and
 * a no-show count shown only for the people who have one.
 */
export default async function AdminVolunteers() {
  await requireAdminSession();

  const timeZone = appTimeZone();
  const people = await listVolunteers();
  const trusted = people.filter((person) => person.trusted).length;
  const paused = people.filter((person) => person.pausedAt !== null).length;

  return (
    <>
      <AdminNav current="volunteers" />

      <div className="masthead">
        <h1>People</h1>
        <p>
          Everybody who has signed up at least once. Private to you: none of this is shown to
          anybody, and none of it is added up into a score.
        </p>
      </div>

      {people.length === 0 ? (
        <div className="empty">
          <h2>Nobody has signed up yet</h2>
          <p>
            People appear here the first time they claim a spot. There is nothing to set up:
            Khair has no accounts, and a volunteer is recognised by their phone number.
          </p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{people.length}</span>
              <span className="stat-label">{people.length === 1 ? "person" : "people"}</span>
            </div>
            <div className="stat">
              <span className="stat-value">{trusted}</span>
              <span className="stat-label">trusted with important work</span>
            </div>
            <div className="stat">
              <span className="stat-value">{paused}</span>
              <span className="stat-label">
                {paused === 1 ? "person paused" : "people paused"}
              </span>
            </div>
          </div>

          {people.map((person) => (
            <article className="slot slot-stacked" key={person.phone}>
              <div>
                <div className="slot-head">
                  <h2>
                    <a href={`/admin/volunteers/${encodeURIComponent(person.phone)}`}>
                      {person.name}
                    </a>
                  </h2>
                  {person.pausedAt ? <span className="spots urgent">Paused</span> : null}
                  {person.trusted ? <span className="spots audience">Trusted</span> : null}
                  {person.upcoming > 0 ? (
                    <span className="spots">
                      {person.upcoming} coming up
                    </span>
                  ) : null}
                </div>
                <p className="detail">
                  <span className="when">{formatPhoneForDisplay(person.phone)}</span>
                  {" · "}
                  {person.signups === 1 ? "1 signup" : `${person.signups} signups`}
                  {/* Shown only when there is one. Printing "0 no-shows" next
                      to every name would turn a list of people into a
                      scoreboard, which is the one thing this must not be. */}
                  {person.noShows > 0
                    ? ` · ${person.noShows === 1 ? "1 no-show" : `${person.noShows} no-shows`}`
                    : null}
                  {person.lastSignupAt
                    ? ` · last signed up ${formatShortDate(person.lastSignupAt, "en", timeZone)}`
                    : null}
                </p>
              </div>
            </article>
          ))}
        </>
      )}
    </>
  );
}
