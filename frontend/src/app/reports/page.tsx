"use client";

import * as React from "react";

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:5000";

type Row = Record<string, unknown>;

const REPORTS: Array<{ id: string; title: string; hint: string }> = [
  { id: "top-crop", title: "1) Top crop by orders", hint: "Max orders per crop type" },
  {
    id: "inactive-farms",
    title: "2) Inactive farms (last month)",
    hint: "No batches listed/sold last month",
  },
  {
    id: "top-driver",
    title: "3) Top driver by trips (last month)",
    hint: "Highest trips last month",
  },
  {
    id: "inactive-restaurants",
    title: "4) Inactive restaurants (last month)",
    hint: "No orders last month",
  },
  {
    id: "batches-by-restaurant",
    title: "5) Batches delivered per restaurant (last month)",
    hint: "What batches delivered to each restaurant",
  },
  { id: "farm-revenue", title: "6) Farm revenue totals", hint: "Revenue per farm" },
];

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function getReport(name: string) {
  const res = await fetch(`${API_BASE}/api/reports/${encodeURIComponent(name)}`);
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw { status: res.status, data };
  // Convention: backend may return `{ rows: [...] }` or an array.
  const rows = Array.isArray(data) ? data : (data?.rows as Row[] | undefined) ?? [];
  return { data, rows };
}

function JsonBox({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <pre className="mt-3 max-h-72 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function DataTable({ rows }: { rows: Row[] }) {
  if (!rows || rows.length === 0) {
    return <div className="text-sm text-muted-foreground">No rows returned.</div>;
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
  const [active, setActive] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [raw, setRaw] = React.useState<unknown>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [busy, setBusy] = React.useState(false);

  async function run(id: string) {
    setActive(id);
    setBusy(true);
    setRows([]);
    setRaw(null);
    setError(null);
    try {
      const r = await getReport(id);
      setRows(r.rows);
      setRaw(r.data);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
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
          <div className="text-right text-xs text-muted-foreground">
            API: <span className="font-mono">{API_BASE}</span>
          </div>
        </div>

        <Separator className="my-6" />

        <Card>
          <CardHeader>
            <CardTitle>Choose a report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {REPORTS.map((r) => (
                <Button
                  key={r.id}
                  variant={active === r.id ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => run(r.id)}
                  disabled={busy}
                >
                  <span className="truncate">{r.title}</span>
                </Button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Returns JSON</Badge>
              <span>Tables render dynamically based on returned columns.</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Table</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <>
                  <div className="text-sm font-medium text-destructive">
                    Request failed
                  </div>
                  <JsonBox value={error} />
                </>
              ) : (
                <DataTable rows={rows} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <JsonBox value={raw} />
              {!raw && !error && (
                <div className="text-sm text-muted-foreground">
                  Pick a report to see the raw response.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

