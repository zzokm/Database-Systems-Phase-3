/** Joins multiple statements returned by the API for display panels. */
export const SQL_DISPLAY_STATEMENT_SEPARATOR =
  "\n\n/* --- next statement --- */\n\n";

/** Extract `sql_executed` from API JSON for display above raw JSON. */
export function sqlExecutedText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const se = (data as Record<string, unknown>).sql_executed;
  if (!Array.isArray(se) || se.length === 0) return null;
  const parts = se
    .map((s) => String(s))
    .filter((chunk) => chunk.replace(/\u00a0/g, " ").trim().length > 0);
  if (parts.length === 0) return null;
  return parts.join(SQL_DISPLAY_STATEMENT_SEPARATOR);
}
