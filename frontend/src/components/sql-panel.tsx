"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { HighlightedSql } from "@/lib/sql-highlight";
import { formatSqlForDisplay, splitSqlIntoStatements } from "@/lib/format-sql-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useBlocks(sqlText: string | null, statements: string[] | null | undefined) {
  return React.useMemo(() => {
    if (statements?.length) {
      return statements.map((s) => s.trim()).filter(Boolean);
    }
    if (sqlText?.trim()) return splitSqlIntoStatements(sqlText);
    return [];
  }, [sqlText, statements]);
}

export function SqlPanel({
  sqlText,
  statements,
  open,
  onOpenChange,
  disabled,
}: {
  sqlText?: string | null;
  statements?: string[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const blocks = useBlocks(sqlText ?? null, statements);
  const formatted = React.useMemo(
    () => blocks.map((b) => formatSqlForDisplay(b) || b),
    [blocks]
  );
  const hasContent = blocks.length > 0;

  if (!hasContent) return null;
  return (
    <div className="rounded-lg border border-emerald-600/25 bg-emerald-950/[0.07] dark:bg-emerald-950/20">
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-full justify-center gap-2 rounded-none rounded-t-lg border-b border-emerald-600/20 text-muted-foreground hover:text-foreground"
        onClick={() => onOpenChange(!open)}
        disabled={disabled}
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        {open ? "Hide raw SQL" : "Show raw SQL"}
      </Button>
      {open ? (
        <div className="p-3 pt-2">
          <div
            className={cn(
              "max-h-96 space-y-3 overflow-y-auto overflow-x-auto rounded-md border border-emerald-600/20 bg-background/80 p-3",
              "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            )}
          >
            {formatted.map((text, i) => (
              <div key={i} className="rounded-md border border-emerald-600/15 bg-muted/10 p-2">
                <HighlightedSql sql={text} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function SqlBox({
  sql,
  statements,
}: {
  sql?: string | null;
  statements?: string[] | null;
}) {
  const blocks = useBlocks(sql ?? null, statements);
  const formatted = React.useMemo(
    () => blocks.map((b) => formatSqlForDisplay(b) || b),
    [blocks]
  );
  if (!blocks.length) return null;
  return (
    <div className="mb-3 max-h-96 space-y-3 overflow-y-auto overflow-x-auto rounded-lg border border-emerald-600/25 bg-emerald-950/[0.07] p-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden dark:bg-emerald-950/20">
      {formatted.map((text, i) => (
        <div key={i} className="rounded-md border border-emerald-600/20 bg-background/40 p-2">
          <HighlightedSql sql={text} />
        </div>
      ))}
    </div>
  );
}
