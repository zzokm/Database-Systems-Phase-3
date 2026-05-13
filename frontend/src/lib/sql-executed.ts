/** Extract `sql_executed` from API JSON for display above raw JSON. */
export function sqlExecutedText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const se = (data as Record<string, unknown>).sql_executed;
  if (!Array.isArray(se) || se.length === 0) return null;
  const parts = se.map((s) => String(s).trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join("\n\n/* --- next statement --- */\n\n");
}
