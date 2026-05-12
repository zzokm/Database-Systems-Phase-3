"use client";

import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import { cn } from "@/lib/utils";

const FETCH_TIMEOUT_MS = 30_000;

const API_BASE = getPublicApiBaseUrl();

type Row = Record<string, unknown>;

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

function DataTable({ rows }: { rows: Row[] }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No rows returned.</div>
    );
  }

  const columns = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r || {}).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  return (
    <div className="overflow-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c} className="whitespace-nowrap">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, idx) => (
            <TableRow key={idx}>
              {columns.map((c) => (
                <TableCell key={c} className="align-top">
                  <span className="font-mono text-xs">
                    {formatCell(r?.[c])}
                  </span>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatCell(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function ReportsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [raw, setRaw] = React.useState<unknown>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = React.useState(false);
  const [lastRunId, setLastRunId] = React.useState<string | null>(null);

  const busy = runningId !== null;
  const lastRun = lastRunId
    ? REPORTS.find((r) => r.id === lastRunId)
    : null;

  async function run(reportId: string) {
    setRunningId(reportId);
    setRows([]);
    setRaw(null);
    setError(null);
    setJsonOpen(false);
    try {
      const r = await getReport(reportId);
      setRows(r.rows);
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
            ) : (
              <DataTable rows={rows} />
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
