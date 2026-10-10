import { closeDb } from "../src/core/db";
import {
  finaliseDeletedTasks,
  purgeExpiredSignups,
  retentionMonths,
} from "../src/core/retention";

purgeExpiredSignups()
  .then(async (result) => {
    console.log(
      `retention ${retentionMonths()} months: deleted ${result.signupsDeleted} signups and ${result.volunteersDeleted} volunteers`,
    );
    const finalised = await finaliseDeletedTasks();
    console.log(`finished ${finalised.tasksDeleted} deleted tasks`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
