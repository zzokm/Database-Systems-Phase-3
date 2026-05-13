"use client";

import * as React from "react";

const KEYWORDS = new Set(
  [
    "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "JOIN", "LEFT", "RIGHT",
    "INNER", "OUTER", "CROSS", "FULL", "ON", "AS", "ORDER", "BY", "GROUP", "HAVING",
    "DISTINCT", "TOP", "UNION", "ALL", "INSERT", "INTO", "UPDATE", "DELETE", "SET",
    "VALUES", "NULL", "IS", "LIKE", "BETWEEN", "EXISTS", "CASE", "WHEN", "THEN",
    "ELSE", "END", "COUNT", "SUM", "MIN", "MAX", "AVG", "OVER", "ASC", "DESC",
    "WITH", "USE", "GO", "CAST", "DATEADD", "DATEDIFF", "GETDATE", "YEAR", "MONTH",
    "DAY", "PARTITION", "FETCH", "NEXT", "ROWS", "ONLY", "OFFSET", "DECLARE", "IF",
    "BEGIN", "RETURN", "EXEC", "EXECUTE", "TABLE", "VIEW", "INDEX", "CONSTRAINT",
    "DEFAULT", "PRIMARY", "KEY", "FOREIGN", "REFERENCES", "CREATE", "ALTER", "DROP",
    "TRUNCATE", "MERGE", "APPLY", "PIVOT", "UNPIVOT", "SOME", "ANY",
  ].map((s) => s.toUpperCase())
);

const KIND_CLASS: Record<string, string> = {
  kw: "font-semibold text-sky-600 dark:text-sky-400",
  str: "text-amber-700 dark:text-amber-300",
  com: "italic text-emerald-700/95 dark:text-emerald-400/90",
  num: "text-violet-600 tabular-nums dark:text-violet-400",
  id: "text-cyan-800 dark:text-cyan-300",
  sym: "text-muted-foreground",
  ws: "text-foreground/80",
};

type Tok = { kind: keyof typeof KIND_CLASS; text: string };

function lexSql(sql: string): Tok[] {
  const out: Tok[] = [];
  const n = sql.length;
  let i = 0;

  const push = (kind: Tok["kind"], text: string) => {
    if (!text) return;
    out.push({ kind, text });
  };

  while (i < n) {
    const c = sql[i];

    if (c === "-" && sql[i + 1] === "-") {
      let j = i + 2;
      while (j < n && sql[j] !== "\n" && sql[j] !== "\r") j++;
      push("com", sql.slice(i, j));
      i = j;
      continue;
    }

    if (c === "/" && sql[i + 1] === "*") {
      let j = i + 2;
      while (j + 1 < n && !(sql[j] === "*" && sql[j + 1] === "/")) j++;
      j = Math.min(j + 2, n);
      push("com", sql.slice(i, j));
      i = j;
      continue;
    }

    if (c === "'") {
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      push("str", sql.slice(i, j));
      i = j;
      continue;
    }

    if (c === "N" && sql[i + 1] === "'") {
      let j = i + 2;
      while (j < n) {
        if (sql[j] === "'") {
          if (sql[j + 1] === "'") {
            j += 2;
            continue;
          }
          j++;
          break;
        }
        j++;
      }
      push("str", sql.slice(i, j));
      i = j;
      continue;
    }

    if (c === "[") {
      let j = i + 1;
      while (j < n && sql[j] !== "]") j++;
      j = Math.min(j + 1, n);
      push("id", sql.slice(i, j));
      i = j;
      continue;
    }

    if (/\s/.test(c)) {
      let j = i + 1;
      while (j < n && /\s/.test(sql[j])) j++;
      push("ws", sql.slice(i, j));
      i = j;
      continue;
    }

    if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[0-9.]/.test(sql[j])) j++;
      push("num", sql.slice(i, j));
      i = j;
      continue;
    }
    if (c === "." && i + 1 < n && /[0-9]/.test(sql[i + 1])) {
      let j = i + 1;
      while (j < n && /[0-9.]/.test(sql[j])) j++;
      push("num", sql.slice(i, j));
      i = j;
      continue;
    }

    if (/[a-zA-Z_@#]/.test(c)) {
      let j = i + 1;
      while (j < n && /[a-zA-Z0-9_@#$]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const up = word.toUpperCase();
      push(KEYWORDS.has(up) ? "kw" : "id", word);
      i = j;
      continue;
    }

    push("sym", c);
    i++;
  }

  return out;
}

/** Renders SQL with lightweight T-SQL–oriented coloring (no external highlighter). */
export function HighlightedSql({ sql }: { sql: string }) {
  const tokens = React.useMemo(() => lexSql(sql), [sql]);
  return (
    <code className="block font-mono text-[0.8125rem] leading-relaxed">
      {tokens.map((t, idx) => (
        <span key={idx} className={KIND_CLASS[t.kind] ?? ""}>
          {t.text}
        </span>
      ))}
    </code>
  );
}
