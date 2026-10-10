import { randomBytes } from "node:crypto";
import { closeDb, db, inTransaction } from "../src/core/db";
import { SYNTHETIC_PHONE_PREFIX } from "../src/core/erasure";

/**
 * Synthetic Volunteers and history, so trust and no-show behaviour can be
 * built and judged before the app has any real history to judge.
 *
 * Every number comes from +1 555 0100 through +1 555 0199, the block NANP
 * reserves for fiction. A fake number can then never collide with a real
 * congregant's, and the whole synthetic set is identifiable by pattern and
 * removable in one statement. Nothing here invents a realistic-looking
 * number, which is the point.
 *
 * Tasks have no phone number to recognise them by, so the ones created here
 * are flagged `demo` and go with the rest.
 *
 * Inserted directly rather than through the core, because the core refuses
 * most of this on purpose: a Task cannot be published into the past and a
 * passed Task cannot be claimed. This is a fixture, not a user.
 *
 *   docker compose run --rm web npm run demo:seed
 *   docker compose run --rm web npm run demo:clear
 */

if (process.env.NODE_ENV === "production") {
  console.error(
    "demo:seed refuses to run in production. Synthetic volunteers must never reach a real deployment.",
  );
  process.exit(1);
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const at = (daysFromNow: number) => new Date(Date.now() + daysFromNow * DAY);

/** `+155501` plus two digits: the reserved block and nothing else. */
const phone = (n: number) => `${SYNTHETIC_PHONE_PREFIX}${String(n).padStart(2, "0")}`;

type Outcome = "done" | "no_show" | "cancelled";

type Person = {
  n: number;
  name: string;
  trusted: boolean;
  /** One entry per past Task, oldest first. `null` means they did not sign up. */
  history: (Outcome | null)[];
};

/**
 * A congregation that gives the Admin something to read.
 *
 * Deliberately not a tidy gradient. The useful judgements are the awkward
 * ones: somebody who has helped six times and cancelled once in good time is
 * not the same as somebody who claims a Slot and does not come, and neither
 * is a number the app should be reducing to a score. The record is a list,
 * and this seed makes that list worth looking at.
 */
const people: Person[] = [
  {
    n: 1,
    name: "Demo Fatima Z.",
    trusted: true,
    history: ["done", "done", "done", "done", "done", "done"],
  },
  {
    n: 2,
    name: "Demo Omar K.",
    trusted: true,
    // Cancelled once, a week ahead, which is the kind the Admin can re-advertise.
    history: ["done", "done", "cancelled", "done", "done", null],
  },
  {
    n: 3,
    name: "Demo Bilal A.",
    trusted: false,
    // The case ticket 10 exists for: claims Slots, does not come.
    history: ["done", "no_show", "no_show", null, "no_show", "done"],
  },
  {
    n: 4,
    name: "Demo Nadia H.",
    trusted: false,
    history: [null, null, "done", null, null, "done"],
  },
  {
    n: 5,
    name: "Demo Yusuf B.",
    trusted: true,
    history: ["done", "done", null, "done", "done", "done"],
  },
  {
    n: 6,
    name: "Demo Amina S.",
    trusted: false,
    // Signed up once, long ago, and never again.
    history: ["done", null, null, null, null, null],
  },
  {
    n: 7,
    name: "Demo Hamza R.",
    trusted: false,
    // Cancels late, repeatedly: different from a no-show, and worth seeing.
    history: ["cancelled", "done", "cancelled", "cancelled", null, "done"],
  },
  {
    n: 8,
    name: "Demo Layla M.",
    trusted: false,
    history: [null, null, null, "done", "done", "done"],
  },
];

/** Six Tasks behind us, newest last, so the history has somewhere to hang. */
const pastTasks = [
  { title: "Demo: Jumu'ah hall setup", location: "Main hall", slots: 4, daysAgo: 42 },
  { title: "Demo: Ramadan iftar serving", location: "Basement hall", slots: 6, daysAgo: 35 },
  { title: "Demo: Carpet cleaning", location: "Prayer hall", slots: 3, daysAgo: 28 },
  { title: "Demo: Shoe rack repair", location: "Entrance lobby", slots: 1, daysAgo: 21 },
  { title: "Demo: Eid clean-up", location: "Grounds", slots: 5, daysAgo: 14 },
  { title: "Demo: Winter coat drive sorting", location: "Classroom 2", slots: 4, daysAgo: 7 },
];

async function seed(): Promise<void> {
  await inTransaction(async (client) => {
    const taskIds: string[] = [];

    for (const task of pastTasks) {
      const startsAt = at(-task.daysAgo);
      const { rows } = await client.query<{ id: string }>(
        `insert into tasks
           (title, description, location, starts_at, due_by, slots_needed, created_at, demo)
         values ($1, $2, $3, $4, $5, $6, $7, true)
         returning id`,
        [
          task.title,
          "Synthetic history for judging trust. Not real work.",
          task.location,
          startsAt,
          new Date(startsAt.getTime() + 3 * HOUR),
          task.slots,
          new Date(startsAt.getTime() - 10 * DAY),
        ],
      );
      taskIds.push(rows[0]!.id);
    }

    // One important Task, published now, so the early-access window can be
    // seen working rather than only tested.
    await client.query(
      `insert into tasks
         (title, description, location, due_by, slots_needed, important, demo)
       values ($1, $2, $3, $4, $5, true, true)`,
      [
        "Demo: Driving a family home from hospital",
        "Important, so trusted volunteers see it first. Not real work.",
        "From the General",
        at(3),
        1,
      ],
    );

    for (const person of people) {
      await client.query(
        `insert into volunteers (phone, name, trusted, created_at) values ($1, $2, $3, $4)
         on conflict (phone) do update set name = excluded.name, trusted = excluded.trusted`,
        [phone(person.n), person.name, person.trusted, at(-60)],
      );

      person.history.forEach(() => undefined);
      for (const [index, outcome] of person.history.entries()) {
        if (outcome === null) continue;
        const taskId = taskIds[index];
        if (!taskId) continue;

        const claimedAt = at(-pastTasks[index]!.daysAgo - 5);
        await client.query(
          `insert into signups
             (task_id, volunteer_phone, name_snapshot, cancel_token, outcome, cancelled_at,
              created_at)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [
            taskId,
            phone(person.n),
            person.name,
            `demo-${randomBytes(12).toString("base64url")}`,
            outcome,
            // A cancellation always carries its timestamp, which is what the
            // Admin reads as "how much notice did they give".
            outcome === "cancelled"
              ? new Date(at(-pastTasks[index]!.daysAgo).getTime() - 2 * HOUR)
              : null,
            claimedAt,
          ],
        );
      }
    }
  });

  const { rows } = await db().query<{ volunteers: string; signups: string; tasks: string }>(
    `select
       (select count(*) from volunteers where phone like $1) as volunteers,
       (select count(*) from signups where volunteer_phone like $1) as signups,
       (select count(*) from tasks where demo) as tasks`,
    [`${SYNTHETIC_PHONE_PREFIX}%`],
  );

  const counted = rows[0];
  console.log(
    `seeded ${counted?.volunteers ?? 0} demo volunteers, ${counted?.signups ?? 0} demo signups and ${counted?.tasks ?? 0} demo tasks`,
  );
  console.log("clear it all with: npm run demo:clear");
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
