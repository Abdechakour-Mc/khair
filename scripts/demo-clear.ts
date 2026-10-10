import { closeDb } from "../src/core/db";
import { CLEAR_SYNTHETIC_PHRASE, clearSyntheticData } from "../src/core/erasure";

/**
 * Removes every synthetic record and leaves real records untouched: the one
 * command to run before the app reaches the congregation.
 *
 * The same core function the Admin's own "clear the demo data" button calls,
 * so there is one definition of what counts as synthetic - a phone number in
 * the +1 555 01xx block, or a Task the demo seed created - and no second
 * version of it to drift.
 */
clearSyntheticData(CLEAR_SYNTHETIC_PHRASE)
  .then((cleared) => {
    console.log(
      `deleted ${cleared.signups} signups, ${cleared.volunteers} volunteer records and ${cleared.tasks} tasks`,
    );
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closeDb);
