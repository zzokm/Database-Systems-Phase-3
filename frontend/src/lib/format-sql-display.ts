import { format } from "sql-formatter";

import { SQL_DISPLAY_STATEMENT_SEPARATOR } from "@/lib/sql-executed";

/** If the string only contains literal `\n` (two-character escapes), convert to real newlines. */
function normalizePossibleEscapedNewlines(sql: string): string {
  const hasRealNewline = /[\n\r]/.test(sql);
  const hasEscaped = /\\[nrt]/.test(sql);
  if (hasEscaped && !hasRealNewline) {
    return sql.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\r/g, "\n").replace(/\\t/g, "\t");
  }
  return sql;
}

const FORMAT_OPTS = {
  language: "transactsql" as const,
  tabWidth: 2,
  keywordCase: "upper" as const,
  indentStyle: "standard" as const,
};

/**
 * Pretty-print T-SQL for the UI: restores newlines, formats each statement
 * chunk (multi-statement payloads from `sql_executed`), and leaves chunks
 * unchanged if the formatter rejects them.
 */
export function formatSqlForDisplay(sql: string): string {
  const normalized = normalizePossibleEscapedNewlines(sql).trim();
  if (!normalized) return "";

  const sep = SQL_DISPLAY_STATEMENT_SEPARATOR;
  const chunks = normalized.includes(sep)
    ? normalized.split(sep).map((c) => c.trim()).filter(Boolean)
    : [normalized];

  return chunks
    .map((chunk) => {
      try {
        return format(chunk, FORMAT_OPTS);
      } catch {
        return chunk;
      }
    })
    .join(sep);
}
