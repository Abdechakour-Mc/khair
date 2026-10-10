/**
 * Core errors carry a stable code, not just a sentence, because the pages
 * that show them read in three languages. The English `message` is for logs
 * and for tests; the UI looks the code up in its own translations.
 */

export type ValidationCode =
  | "title_required"
  | "deadline_required"
  | "start_invalid"
  | "start_after_deadline"
  | "slots_too_few"
  | "name_required"
  | "name_too_long"
  | "phone_required"
  | "phone_invalid";

/** Something the person filling in a form got wrong, and can fix. */
export class ValidationError extends Error {
  readonly field: string;
  readonly code: ValidationCode;

  constructor(field: string, code: ValidationCode, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
    this.code = code;
  }
}

export type ConflictReason =
  | "task_full"
  | "already_signed_up"
  | "task_closed"
  | "task_passed"
  | "task_missing";

/** The request was sound but the world moved on: a Slot was taken, a Task closed. */
export class ConflictError extends Error {
  readonly reason: ConflictReason;

  constructor(reason: ConflictReason, message: string) {
    super(message);
    this.name = "ConflictError";
    this.reason = reason;
  }
}
