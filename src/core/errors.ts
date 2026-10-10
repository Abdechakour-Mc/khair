/**
 * Something the person filling in a form got wrong, and can fix. Carries the
 * field so the UI can show the message beside the input it concerns.
 */
export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/** The request was sound but the world moved on: a Slot was taken, a Task closed. */
export class ConflictError extends Error {
  readonly reason: string;

  constructor(reason: string, message: string) {
    super(message);
    this.name = "ConflictError";
    this.reason = reason;
  }
}
