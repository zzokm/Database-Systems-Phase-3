"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Loader2 } from "lucide-react";

import { DynamicDataTable } from "@/components/dynamic-data-table";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const LOOKUPS = [
  {
    id: "farms",
    title: "Farms",
    path: "/api/farms",
    description: "FarmID, name, and location for reference when inserting batches.",
  },
  {
    id: "restaurants",
    title: "Restaurants",
    path: "/api/restaurants",
    description: "Restaurant IDs and delivery details for updates and orders.",
  },
  {
    id: "drivers",
    title: "Drivers",
    path: "/api/drivers",
    description: "Driver directory for trip and driver CRUD forms.",
  },
  {
    id: "crop-types",
    title: "Crop types",
    path: "/api/crop-types",
    description: "CropTypeID and names for harvest batch inserts.",
  },
] as const;

type LookupId = (typeof LOOKUPS)[number]["id"];

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function httpError(status: number, data: unknown) {
  const err = new Error(`HTTP ${status}`);
  return Object.assign(err, { status, data }) as Error & {
    status: number;
    data: unknown;
  };
}

async function postJson(path: string, body: unknown) {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw httpError(res.status, data);
  return data;
}

async function putJson(path: string, body: unknown) {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw httpError(res.status, data);
  return data;
}

async function del(path: string) {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, { method: "DELETE" });
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) throw httpError(res.status, data);
  return data;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function JsonBox({ value }: { value: unknown }) {
  if (!value) return null;
  return (
    <pre className="mt-3 max-h-56 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function JsonPanel({
  value,
  open,
  onOpenChange,
  disabled,
}: {
  value: unknown;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/20">
      <Button
        type="button"
        variant="ghost"
        className="h-10 w-full justify-center gap-2 rounded-none rounded-t-lg border-b border-border/60 text-muted-foreground hover:text-foreground"
        onClick={() => onOpenChange(!open)}
        disabled={disabled}
      >
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
        {open ? "Hide raw JSON" : "Show raw JSON"}
      </Button>
      {open ? (
        <div className="p-3 pt-2">
          <pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs leading-relaxed font-mono whitespace-pre-wrap">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

async function getLookup(path: string) {
  const res = await fetchWithTimeout(`${API_BASE}${path}`);
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

/** Normalize fetch errors so API JSON bodies (message, status) are visible in the panel */
function serializeRequestError(e: unknown): unknown {
  if (e && typeof e === "object" && "status" in e && "data" in e) {
    const err = e as Error & { status: number; data: unknown };
    return {
      http: err.status,
      note: err.message,
      body: err.data,
    };
  }
  if (e instanceof Error) return { message: e.message };
  return e;
}

function parseNumber(value: FormDataEntryValue | null, fieldName: string) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid number for ${fieldName}`);
  }
  return n;
}

export default function CrudPage() {
  const [mainTab, setMainTab] = React.useState("insert");
  const [readLookup, setReadLookup] = React.useState<LookupId>("farms");
  const [readRows, setReadRows] = React.useState<Row[]>([]);
  const [readRaw, setReadRaw] = React.useState<unknown>(null);
  const [readError, setReadError] = React.useState<unknown>(null);
  const [readLoading, setReadLoading] = React.useState(false);
  const [readJsonOpen, setReadJsonOpen] = React.useState(false);
  const [readSortColumn, setReadSortColumn] = React.useState("");
  const [readSortDir, setReadSortDir] = React.useState<"asc" | "desc">("asc");
  const [readSliceMode, setReadSliceMode] = React.useState<SliceMode>("all");
  const [readSliceCount, setReadSliceCount] = React.useState(10);
  const [readNonce, setReadNonce] = React.useState(0);

  const [result, setResult] = React.useState<unknown>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [busy, setBusy] = React.useState(false);

  const readLookupMeta = React.useMemo(
    () => LOOKUPS.find((l) => l.id === readLookup) ?? LOOKUPS[0],
    [readLookup]
  );

  React.useEffect(() => {
    if (mainTab !== "read") return;
    let cancelled = false;
    (async () => {
      setReadLoading(true);
      setReadRows([]);
      setReadRaw(null);
      setReadError(null);
      setReadJsonOpen(false);
      try {
        const r = await getLookup(readLookupMeta.path);
        if (cancelled) return;
        const nextRows = r.rows;
        setReadRows(nextRows);
        const keys = columnKeys(nextRows);
        setReadSortColumn(keys[0] ?? "");
        setReadSortDir("asc");
        setReadSliceMode("all");
        setReadSliceCount(10);
        setReadRaw(r.data);
      } catch (e) {
        if (cancelled) return;
        setReadRows([]);
        setReadError(e);
        const ex = e as Error & { status?: number; data?: unknown };
        setReadRaw(ex.data ?? { message: ex.message, status: ex.status });
      } finally {
        if (!cancelled) setReadLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab, readLookup, readLookupMeta.path, readNonce]);

  const readDisplayRows = React.useMemo(
    () =>
      applyTableView(readRows, {
        sortKey: readSortColumn,
        sortDir: readSortDir,
        sliceMode: readSliceMode,
        sliceN: readSliceCount,
      }),
    [readRows, readSortColumn, readSortDir, readSliceMode, readSliceCount]
  );

  const readTableColumns = React.useMemo(() => columnKeys(readRows), [readRows]);

  async function run<T>(fn: () => Promise<T>) {
    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full">
      <SiteHeader active="crud" />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">CRUD</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Use the forms below to create, update, or delete sample records, or
              open READ to browse lookup lists from the API.
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="insert">INSERT</TabsTrigger>
            <TabsTrigger value="update">UPDATE</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
            <TabsTrigger value="read">READ</TabsTrigger>
          </TabsList>

          <TabsContent value="insert" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Add Harvest Batch</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      run(() =>
                        postJson("/api/harvest-batches", {
                          FarmID: parseNumber(fd.get("farm_id"), "FarmID"),
                          CropTypeID: parseNumber(fd.get("crop_type_id"), "CropTypeID"),
                          HarvestDate: String(fd.get("harvest_date")),
                          AvailableQuantityKG: parseNumber(
                            fd.get("available_quantity_kg"),
                            "AvailableQuantityKG"
                          ),
                          PricePerKG: parseNumber(fd.get("price_per_kg"), "PricePerKG"),
                          IsAvailable: String(fd.get("is_available")) === "true",
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="farm_id">Farm ID</Label>
                      <Input id="farm_id" name="farm_id" placeholder="1" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="crop_type_id">Crop Type ID</Label>
                      <Input
                        id="crop_type_id"
                        name="crop_type_id"
                        placeholder="3"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="harvest_date">Harvest Date</Label>
                      <Input id="harvest_date" name="harvest_date" type="date" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="available_quantity_kg">Available Quantity (KG)</Label>
                      <Input
                        id="available_quantity_kg"
                        name="available_quantity_kg"
                        type="number"
                        min={0.01}
                        step="0.01"
                        placeholder="250"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="price_per_kg">Price Per KG</Label>
                      <Input
                        id="price_per_kg"
                        name="price_per_kg"
                        type="number"
                        min={0.01}
                        step="0.01"
                        placeholder="22.50"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="is_available">Is Available</Label>
                      <select
                        id="is_available"
                        name="is_available"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        defaultValue="true"
                      >
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </div>
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Add Driver</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      run(() =>
                        postJson("/api/drivers", {
                          FirstName: String(fd.get("first_name")),
                          LastName: String(fd.get("last_name")),
                          Phone: String(fd.get("phone") || ""),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input id="first_name" name="first_name" placeholder="Ahmed" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input id="last_name" name="last_name" placeholder="Hassan" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" placeholder="0100..." />
                    </div>
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="update" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Update Restaurant Delivery Window</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const restaurantId = String(fd.get("restaurant_id"));
                      run(() =>
                        putJson(`/api/restaurants/${encodeURIComponent(restaurantId)}/delivery-window`, {
                          PreferredDeliveryWindow: String(
                            fd.get("preferred_delivery_window")
                          ).trim(),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="restaurant_id">Restaurant ID</Label>
                      <Input id="restaurant_id" name="restaurant_id" placeholder="5" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="preferred_delivery_window">Preferred Delivery Window</Label>
                      <Input
                        id="preferred_delivery_window"
                        name="preferred_delivery_window"
                        placeholder="10:00-14:00"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update Trip Distance</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const tripId = String(fd.get("trip_id"));
                      run(() =>
                        putJson(`/api/trips/${encodeURIComponent(tripId)}/route`, {
                          TotalDistanceKM: parseNumber(
                            fd.get("total_distance_km"),
                            "TotalDistanceKM"
                          ),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="trip_id">Trip ID</Label>
                      <Input id="trip_id" name="trip_id" placeholder="12" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="total_distance_km">Total Distance (KM)</Label>
                      <Input
                        id="total_distance_km"
                        name="total_distance_km"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="42.5"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Delete Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const orderId = String(fd.get("order_id"));
                      run(() => del(`/api/orders/${encodeURIComponent(orderId)}`));
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="order_id">Order ID</Label>
                      <Input id="order_id" name="order_id" placeholder="1001" required />
                    </div>
                    <Button type="submit" variant="destructive" disabled={busy}>
                      Delete
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Remove Harvest Batch</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const batchId = String(fd.get("batch_id"));
                      run(() => del(`/api/harvest-batches/${encodeURIComponent(batchId)}`));
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="batch_id">Batch ID</Label>
                      <Input id="batch_id" name="batch_id" placeholder="77" required />
                    </div>
                    <Button type="submit" variant="destructive" disabled={busy}>
                      Delete
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="read" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lookup data</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Read-only lists from{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    GET {readLookupMeta.path}
                  </code>
                  . {readLookupMeta.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Source</span>
                  <div className="flex flex-wrap gap-2">
                    {LOOKUPS.map((l) => (
                      <Button
                        key={l.id}
                        type="button"
                        size="sm"
                        variant={readLookup === l.id ? "default" : "outline"}
                        className="h-8"
                        onClick={() => setReadLookup(l.id)}
                      >
                        {l.title}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8"
                    disabled={readLoading}
                    onClick={() => setReadNonce((n) => n + 1)}
                  >
                    {readLoading ? (
                      <>
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                        Loading
                      </>
                    ) : (
                      "Refresh"
                    )}
                  </Button>
                </div>

                {readError ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-destructive">
                      {(readError as Error)?.message ?? "Request failed"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Expand raw JSON below for the error payload returned by the API.
                    </p>
                  </div>
                ) : null}

                {!readError && readRows.length === 0 && !readLoading ? (
                  <DynamicDataTable rows={readRows} />
                ) : !readError && readRows.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto rounded-lg border bg-muted/20 px-3 py-2">
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Sort by
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={readTableColumns.length === 0}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "h-8 min-w-[6rem] max-w-[min(100%,14rem)] shrink justify-between gap-1 px-2 font-normal",
                            "disabled:pointer-events-none disabled:opacity-50"
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate text-left">
                            {readSortColumn || "Column"}
                          </span>
                          <ChevronDown className="size-4 shrink-0 opacity-60" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="max-w-[min(100vw-2rem,20rem)]"
                        >
                          <DropdownMenuGroup>
                            {readTableColumns.map((k) => (
                              <DropdownMenuItem
                                key={k}
                                className="justify-between gap-2"
                                onClick={() => setReadSortColumn(k)}
                              >
                                <span className="min-w-0 flex-1 truncate">{k}</span>
                                {readSortColumn === k ? (
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
                          readSortDir === "asc"
                            ? "Sorted ascending. Click for descending."
                            : "Sorted descending. Click for ascending."
                        }
                        title={
                          readSortDir === "asc"
                            ? "Ascending (click for descending)"
                            : "Descending (click for ascending)"
                        }
                        onClick={() =>
                          setReadSortDir((d) => (d === "asc" ? "desc" : "asc"))
                        }
                      >
                        {readSortDir === "asc" ? (
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
                            {SLICE_MODE_LABEL[readSliceMode]}
                          </span>
                          <ChevronDown className="size-4 shrink-0 opacity-60" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuGroup>
                            {(["all", "top", "bottom"] as const).map((m) => (
                              <DropdownMenuItem
                                key={m}
                                className="justify-between gap-2"
                                onClick={() => setReadSliceMode(m)}
                              >
                                <span>{SLICE_MODE_LABEL[m]}</span>
                                {readSliceMode === m ? (
                                  <Check className="size-4 shrink-0 text-primary" />
                                ) : null}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Label
                        htmlFor="read-slice-n"
                        className="mb-0 shrink-0 text-xs text-muted-foreground"
                      >
                        N
                      </Label>
                      <Input
                        id="read-slice-n"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={Math.max(1, readRows.length)}
                        disabled={readSliceMode === "all"}
                        value={readSliceCount}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (Number.isFinite(v))
                            setReadSliceCount(Math.max(1, Math.floor(v)));
                        }}
                        className="h-7 w-11 px-1.5 text-xs md:w-12"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {readSliceMode === "all"
                        ? `${readDisplayRows.length} row${readDisplayRows.length === 1 ? "" : "s"}.`
                        : `${readDisplayRows.length} of ${readRows.length} row${readRows.length === 1 ? "" : "s"} (${readSliceMode === "top" ? "top" : "bottom"} ${Math.min(readSliceCount, readRows.length)} after sort).`}
                    </p>
                    <DynamicDataTable rows={readDisplayRows} />
                  </div>
                ) : readLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading…
                  </div>
                ) : null}

                <JsonPanel
                  value={readRaw}
                  open={readJsonOpen}
                  onOpenChange={setReadJsonOpen}
                  disabled={!readRaw && !readError}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {(!!result || !!error) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <>
                  <div className="text-sm font-medium text-destructive">
                    Request failed
                  </div>
                  <JsonBox value={serializeRequestError(error)} />
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">Success</div>
                  <JsonBox value={result} />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

