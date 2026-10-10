import { closeDb, db } from "../src/core/db";
import { publishTask } from "../src/core/tasks";

/**
 * Example Tasks for local development, dated relative to now so the list is
 * never empty. Ticket 04 gives the Admin a form and makes this unnecessary.
 */
const HOUR = 60 * 60 * 1000;
const at = (hours: number) => new Date(Date.now() + hours * HOUR);

async function seed() {
  const { rows } = await db().query<{ count: string }>("select count(*) from tasks");
  if (Number(rows[0]?.count ?? 0) > 0) {
    console.log("tasks already present, leaving them alone");
    return;
  }

  await publishTask({
    title: "Jumu'ah hall setup",
    description: "Lay out the rows and carry the dividers through.",
    location: "Main hall",
    startsAt: at(26),
    dueBy: at(28),
    slotsNeeded: 3,
  });

  await publishTask({
    title: "Qur'an class refreshments",
    description: "Pour tea for the children's circle and clear up after.",
    location: "Classroom 2",
    startsAt: at(32),
    dueBy: at(34),
    slotsNeeded: 2,
  });

  await publishTask({
    title: "Unloading the new carpet rolls",
    description: "Four pairs of hands for about an hour. Heavy lifting.",
    location: "Car park",
    startsAt: at(74),
    dueBy: at(78),
    slotsNeeded: 4,
  });

  await publishTask({
    title: "Wudu area deep clean",
    description: "Drains, taps and the floor channels.",
    location: "Wudu area",
    startsAt: at(120),
    dueBy: at(123),
    slotsNeeded: 2,
  });

  await publishTask({
    title: "Grounds litter pick",
    description: "Any time that suits you. Bags are in the store cupboard.",
    location: "Grounds",
    dueBy: at(160),
    slotsNeeded: 2,
  });

  await publishTask({
    title: "Shoe rack repair",
    description: "The third shelf has come away from its bracket.",
    location: "Entrance lobby",
    dueBy: at(210),
  });

  // The two fields a developer is most likely to get wrong by not seeing
  // them: who the work is for, and the urgent pin at the top of the list.
  await publishTask({
    title: "Sisters' entrance welcome desk",
    description: "Greeting people and handing out the class timetable.",
    location: "Sisters' entrance",
    openTo: "sisters",
    startsAt: at(27),
    dueBy: at(30),
    slotsNeeded: 2,
  });

  await publishTask({
    title: "Drive a family home from the hospital",
    description: "Tomorrow afternoon, somewhere with room for a wheelchair.",
    location: "From the General",
    urgent: true,
    dueBy: at(20),
  });

  console.log("seeded 8 tasks");
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
