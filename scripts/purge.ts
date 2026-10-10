import { closeDb } from "../src/core/db";
import { purgeExpiredSignups, retentionMonths } from "../src/core/retention";

purgeExpiredSignups()
  .then((result) => {
    console.log(
      `retention ${retentionMonths()} months: deleted ${result.signupsDeleted} signups and ${result.volunteersDeleted} volunteers`,
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
