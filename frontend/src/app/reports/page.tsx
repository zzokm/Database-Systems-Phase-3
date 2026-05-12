"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DynamicDataTable } from "@/components/dynamic-data-table";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import {
  applyTableView,
  columnKeys,
  type Row,
  SLICE_MODE_LABEL,
  type SliceMode,
} from "@/lib/table-view";
import { cn } from "@/lib/utils";

const FETCH_TIMEOUT_MS = 30_000;

const API_BASE = getPublicApiBaseUrl();

const REPORTS: Array<{
  queryNumber: number;
  id: string;
  title: string;
  hint: string;
  description: string;
}> = [
  {
    queryNumber: 1,
    id: "top-crop",
    title: "Top crop by orders",
    hint: "Max orders per crop type",
    description:
      "Ranks crop types by how often they appear on order lines, using harvest batches and order details so you can see which produce drives the most order volume.",
  },
  {
    queryNumber: 2,
    id: "inactive-farms",
    title: "Inactive farms (last month)",
    hint: "No batches listed/sold last month",
    description:
      "Lists farms that had no harvest batches with activity in the last calendar month - useful for spotting suppliers that went quiet.",
  },
  {
    queryNumber: 3,
    id: "top-driver",
    title: "Top driver by trips (last month)",
    hint: "Highest trips last month",
    description:
      "Aggregates trips per driver for the last month so you can see who logged the most delivery routes.",
  },
  {
    queryNumber: 4,
    id: "inactive-restaurants",
    title: "Inactive restaurants (last month)",
    hint: "No orders last month",
    description:
      "Finds restaurants that placed no orders in the last calendar month to flag churn or follow-up opportunities.",
  },
  {
    queryNumber: 5,
    id: "batches-by-restaurant",
    title: "Batches delivered per restaurant (last month)",
    hint: "What batches delivered to each restaurant",
    description:
      "Connects orders, batches, and restaurants for the last month so you can see which batch lots were fulfilled to which customers.",
  },
  {
    queryNumber: 6,
    id: "farm-revenue",
    title: "Farm revenue totals",
    hint: "Revenue per farm",
    description:
      "Sums revenue attributable to each farm from fulfilled order lines (quantity × unit price) for an overall farm performance view.",
  },
];

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getReport(name: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(name)}`, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = Object.assign(new Error(`HTTP ${res.status}`), {
      status: res.status,
      data,
    }) as Error & { status: number; data: unknown };
    throw err;
  }
  const rows = Array.isArray(data)
    ? data
    : Array.isArray((data as { rows?: unknown } | null)?.rows)
      ? (((data as { rows?: unknown }).rows as unknown[]) as Row[])
      : [];
  return { data, rows };
}

function JsonBox({
  value,
  className,
}: {
  value: unknown;
  className?: string;
}) {
  if (!value) return null;
  return (
    <pre
      className={cn(
        "max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap",
        className
      )}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function ReportsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [raw, setRaw] = React.useState<unknown>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [lastRunId, setLastRunId] = React.useState<string | null>(null);

  const [sortColumn, setSortColumn] = React.useState("");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [sliceMode, setSliceMode] = React.useState<SliceMode>("all");
  const [sliceCount, setSliceCount] = React.useState(10);

  const busy = runningId !== null;
  const lastRun = lastRunId
    ? REPORTS.find((r) => r.id === lastRunId)
    : null;

  const displayRows = React.useMemo(
    () =>
      applyTableView(rows, {
        sortKey: sortColumn,
        sortDir: sortDir,
        sliceMode,
        sliceN: sliceCount,
      }),
    [rows, sortColumn, sortDir, sliceMode, sliceCount]
  );

  const tableColumns = React.useMemo(() => columnKeys(rows), [rows]);

  async function run(reportId: string) {
    setRunningId(reportId);
    setRows([]);
    setRaw(null);
    setError(null);
    setJsonOpen(false);
    try {
      const r = await getReport(reportId);
      const nextRows = r.rows;
      setRows(nextRows);
      const keys = columnKeys(nextRows);
      setSortColumn(keys[0] ?? "");
      setSortDir("asc");
      setSliceMode("all");
      setSliceCount(10);
      setRaw(r.data);
      setLastRunId(reportId);
    } catch (e) {
      setError(e);
      const ex = e as Error & { status?: number; data?: unknown };
      setRaw(ex.data ?? { message: ex.message, status: ex.status });
      setLastRunId(null);
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="min-h-full">
      <SiteHeader active="reports" />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Run the 6 mandatory analytical inquiries and render the results.
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Run a report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click any card to run that query in one step.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {REPORTS.map((r) => {
                const isRunning = runningId === r.id;
                const isLastRun = lastRunId === r.id && !isRunning;
                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void run(r.id)}
                    className={cn(
                      "flex h-full min-h-[8.5rem] flex-col gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
                      "hover:border-foreground/20 hover:bg-muted/30",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      "disabled:pointer-events-none disabled:opacity-60",
                      isRunning &&
                        "border-primary bg-primary/5 ring-2 ring-primary/30",
                      isLastRun &&
                        !isRunning &&
                        "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20"
                    )}
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums",
                          isRunning || isLastRun
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-muted/70 text-foreground"
                        )}
                        aria-label={`Query ${r.queryNumber}`}
                      >
                        {isRunning ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          r.queryNumber
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold leading-snug tracking-tight">
                            {r.title}
                          </div>
                          {isRunning ? (
                            <span className="shrink-0 text-[0.65rem] font-medium text-primary">
                              Running…
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {r.description}
                        </p>
                        <p className="text-[0.7rem] leading-snug text-muted-foreground/85">
                          {r.hint}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Returns JSON</Badge>
              <span>Table columns follow the API response.</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Results</CardTitle>
            {lastRun ? (
              <p className="text-sm text-muted-foreground">
                Query {lastRun.queryNumber}: {lastRun.title}
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">Last request failed</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click a report card above to populate this panel.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-destructive">
                  {(error as Error)?.message ?? "Request failed"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expand raw JSON below for the error payload returned by the API.
                </p>
              </div>
            ) : rows.length === 0 ? (
              <DynamicDataTable rows={rows} />
            ) : (
              <div className="space-y-3">
                <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border bg-muted/20 px-3 py-2">
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Sort by
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={tableColumns.length === 0}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 min-w-[6rem] max-w-[min(100%,14rem)] shrink justify-between gap-1 px-2 font-normal",
                        "disabled:pointer-events-none disabled:opacity-50"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {sortColumn || "Column"}
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-w-[min(100vw-2rem,20rem)]"
                    >
                      <DropdownMenuGroup>
                        {tableColumns.map((k) => (
                          <DropdownMenuItem
                            key={k}
                            className="justify-between gap-2"
                            onClick={() => setSortColumn(k)}
                          >
                            <span className="min-w-0 flex-1 truncate">{k}</span>
                            {sortColumn === k ? (
                              <Check className="size-4 shrink-0 text-primary" />
                            ) : null}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label={
                      sortDir === "asc"
                        ? "Sorted ascending. Click for descending."
                        : "Sorted descending. Click for ascending."
                    }
                    title={
                      sortDir === "asc"
                        ? "Ascending (click for descending)"
                        : "Descending (click for ascending)"
                    }
                    onClick={() =>
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    }
                  >
                    {sortDir === "asc" ? (
                      <ArrowUp className="size-4" />
                    ) : (
                      <ArrowDown className="size-4" />
                    )}
                  </Button>
                  <span className="ml-1 shrink-0 text-xs text-muted-foreground">
                    Filter
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "h-8 min-w-[7rem] max-w-[11rem] shrink justify-between gap-1 px-2 font-normal"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-left">
                        {SLICE_MODE_LABEL[sliceMode]}
                      </span>
                      <ChevronDown className="size-4 shrink-0 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuGroup>
                        {(["all", "top", "bottom"] as const).map((m) => (
                          <DropdownMenuItem
                            key={m}
                            className="justify-between gap-2"
                            onClick={() => setSliceMode(m)}
                          >
                            <span>{SLICE_MODE_LABEL[m]}</span>
                            {sliceMode === m ? (
                              <Check className="size-4 shrink-0 text-primary" />
                            ) : null}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Label
                    htmlFor="report-slice-n"
                    className="mb-0 shrink-0 text-xs text-muted-foreground"
                  >
                    N
                  </Label>
                  <Input
                    id="report-slice-n"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.max(1, rows.length)}
                    disabled={sliceMode === "all"}
                    value={sliceCount}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v))
                        setSliceCount(Math.max(1, Math.floor(v)));
                    }}
                    className="h-7 w-11 px-1.5 text-xs md:w-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {sliceMode === "all"
                    ? `${displayRows.length} row${displayRows.length === 1 ? "" : "s"}.`
                    : `${displayRows.length} of ${rows.length} row${rows.length === 1 ? "" : "s"} (${sliceMode === "top" ? "top" : "bottom"} ${Math.min(sliceCount, rows.length)} after sort).`}
                </p>
                <DynamicDataTable rows={displayRows} />
              </div>
            )}

            <div className="rounded-lg border border-border/80 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full justify-center gap-2 rounded-none rounded-t-lg border-b border-border/60 text-muted-foreground hover:text-foreground"
                onClick={() => setJsonOpen((o) => !o)}
                disabled={!raw && !error}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-200",
                    jsonOpen && "rotate-180"
                  )}
                />
                {jsonOpen ? "Hide raw JSON" : "Show raw JSON"}
              </Button>
              {jsonOpen ? (
                <div className="p-3 pt-2">
                  <JsonBox value={raw} className="border-0 bg-transparent" />
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
