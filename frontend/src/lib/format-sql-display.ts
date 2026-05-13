import { format } from "sql-formatter";

/** Split old payloads that used an inline comment between statements. */
const LEGACY_STATEMENT_SPLIT =
  /\n\n\/\*\s*---\s*(?:next\s+statement|next\s+request)\s*---\s*\*\/\n\n/gi;

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
  expressionWidth: 96,
  denseOperators: true,
  linesBetweenQueries: 0,
};

function collapseExtraBlankLines(s: string): string {
  return s.replace(/\n{3,}/g, "\n\n").trimEnd();
}

/**
 * Pretty-print one T-SQL statement for the UI (display only).
 * For multiple statements, call once per statement from the caller.
 */
export function formatSqlForDisplay(sql: string): string {
  const normalized = normalizePossibleEscapedNewlines(sql).trim();
  if (!normalized) return "";
  try {
    return collapseExtraBlankLines(format(normalized, FORMAT_OPTS));
  } catch {
    return collapseExtraBlankLines(normalized);
  }
}

/** Split a string that may contain legacy comment separators into statement chunks. */
export function splitSqlIntoStatements(sql: string): string[] {
  const s = sql.trim();
  if (!s) return [];
  if (LEGACY_STATEMENT_SPLIT.test(s)) {
    LEGACY_STATEMENT_SPLIT.lastIndex = 0;
    return s.split(LEGACY_STATEMENT_SPLIT).map((c) => c.trim()).filter(Boolean);
  }
  return [s];
}
