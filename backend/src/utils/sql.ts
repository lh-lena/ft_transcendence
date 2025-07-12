export function isSQLConstraint(err: any): boolean {
  if (!err) return false;

  if (
    (err.code && typeof err.code === "string" && err.code.startsWith("SQLITE_CONSTRAINT")) ||
    (typeof err.message === "string" && err.message.includes("constraint failed"))
  ) {
    return true;
  }
  return false;
}
