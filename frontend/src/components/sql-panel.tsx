"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SqlPanel({
  sqlText,
  open,
  onOpenChange,
  disabled,
}: {
  sqlText: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  if (!sqlText) return null;
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
          <pre className="max-h-96 overflow-auto rounded-md border border-emerald-600/20 bg-background/80 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
            {sqlText}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export function SqlBox({ sql }: { sql: string | null }) {
  if (!sql) return null;
  return (
    <pre className="mb-3 max-h-96 overflow-auto rounded-lg border border-emerald-600/25 bg-emerald-950/[0.07] p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap dark:bg-emerald-950/20">
      {sql}
    </pre>
  );
}
