"use client";

import * as React from "react";
import { Code2 } from "lucide-react";

import { HighlightedSql } from "@/lib/sql-highlight";
import { formatSqlForDisplay } from "@/lib/format-sql-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SqlPeekButtonProps = {
  /** Executed SQL text, or null/empty to show a short placeholder in the dialog. */
  sql: string | null | undefined;
  className?: string;
};

export function SqlPeekButton({ sql, className }: SqlPeekButtonProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const trimmed = sql?.trim() ?? "";
  const formattedSql = React.useMemo(() => {
    if (!trimmed) return "";
    const out = formatSqlForDisplay(trimmed);
    return out || trimmed;
  }, [trimmed]);

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
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">Executed SQL</h2>
          <form method="dialog">
            <Button type="submit" variant="secondary" size="sm" className="h-8">
              Close
            </Button>
          </form>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {trimmed ? (
            <div className="overflow-x-auto rounded-lg border border-border/80 bg-muted/20 p-3">
              <HighlightedSql sql={formattedSql} />
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No SQL is available yet for this panel. After you load data or submit a
              form, the API includes an{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">sql_executed</code>{" "}
              field; open this again to see the exact statements that ran.
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
