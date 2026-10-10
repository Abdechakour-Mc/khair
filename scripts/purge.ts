import { closeDb } from "../src/core/db";
import { retentionMonths, runScheduledCleanup } from "../src/core/retention";

runScheduledCleanup()
  .then((result) => {
    console.log(
      `retention ${retentionMonths()} months: deleted ${result.signupsDeleted} signups and ${result.volunteersDeleted} volunteers, and finished ${result.tasksDeleted} deleted tasks`,
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
