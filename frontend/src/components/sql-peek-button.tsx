"use client";

import * as React from "react";
import { Code2 } from "lucide-react";

import { HighlightedSql } from "@/lib/sql-highlight";
import { formatSqlForDisplay, splitSqlIntoStatements } from "@/lib/format-sql-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SqlPeekButtonProps = {
  /** Preferred: one bordered block per entry (from API `sql_executed` array). */
  statements?: string[] | null | undefined;
  /** Fallback: one string; legacy comment separators are split into blocks. */
  sql?: string | null | undefined;
  className?: string;
};

function useStatementBlocks(
  statements: string[] | null | undefined,
  sql: string | null | undefined
): string[] {
  return React.useMemo(() => {
    if (statements?.length) {
      return statements.map((s) => s.trim()).filter(Boolean);
    }
    const s = sql?.trim() ?? "";
    if (!s) return [];
    return splitSqlIntoStatements(s);
  }, [statements, sql]);
}

export function SqlPeekButton({ statements, sql, className }: SqlPeekButtonProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const blocks = useStatementBlocks(statements, sql);
  const showPreflightHint = React.useMemo(
    () =>
      blocks.length >= 2 &&
      blocks.some((b) => /SELECT\s+1\s+AS\s+x\b/i.test(b)),
    [blocks]
  );

  const formattedBlocks = React.useMemo(
    () => blocks.map((b) => formatSqlForDisplay(b) || b),
    [blocks]
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 gap-1.5 px-2 font-mono text-[0.7rem] font-medium tabular-nums",
          className
        )}
        title="View SQL returned by the API for this panel"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        <Code2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
        SQL
      </Button>
      <dialog
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[min(85vh,40rem)] w-[min(96vw,52rem)] max-w-[52rem] -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xl",
          "open:flex open:flex-col",
          "[&::backdrop]:bg-black/55 [&::backdrop]:backdrop-blur-[1px]"
        )}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Executed SQL</h2>
          <form method="dialog">
            <Button type="submit" variant="secondary" size="sm" className="h-8">
              Close
            </Button>
          </form>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-4",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {blocks.length > 0 ? (
            <div className="space-y-3">
              {formattedBlocks.map((text, i) => (
                <div
                  key={i}
                  className="overflow-x-auto rounded-lg border border-border/80 bg-muted/20 p-3"
                >
                  <HighlightedSql sql={text} />
                </div>
              ))}
              {showPreflightHint ? (
                <p className="text-xs leading-snug text-muted-foreground">
                  <span className="font-medium text-foreground">About </span>
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.65rem]">
                    SELECT 1 AS x
                  </code>
                  <span className="font-medium text-foreground"> checks: </span>
                  the API only needs to know whether a matching row exists. The literal{" "}
                  <code className="rounded bg-muted px-0.5 font-mono text-[0.65rem]">1</code> is a
                  dummy value; <code className="rounded bg-muted px-0.5 font-mono text-[0.65rem]">x</code>{" "}
                  is just the column alias. That is not your quantity, farm count, or crop weight.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No SQL is available yet for this panel. After you load data or submit a form, the API
              includes an{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sql_executed</code> field; open
              this again to see the exact statements that ran.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
