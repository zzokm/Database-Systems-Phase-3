/** Ordered statements from the API `sql_executed` array (one UI block per entry). */
export function sqlExecutedStatements(data: unknown): string[] | null {
  if (!data || typeof data !== "object") return null;
  const se = (data as Record<string, unknown>).sql_executed;
  if (!Array.isArray(se) || se.length === 0) return null;
  const parts = se
    .map((s) => String(s))
    .filter((chunk) => chunk.replace(/\u00a0/g, " ").trim().length > 0);
  return parts.length > 0 ? parts : null;
}

/** Single string for raw JSON / legacy panels (blank line between statements only). */
export function sqlExecutedText(data: unknown): string | null {
  const parts = sqlExecutedStatements(data);
  if (!parts?.length) return null;
  return parts.join("\n\n");
}
