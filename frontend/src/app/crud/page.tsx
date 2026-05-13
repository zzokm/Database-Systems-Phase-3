"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Loader2 } from "lucide-react";

import { CrudSelectDropdown } from "@/components/crud-select-dropdown";
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

function extractApiMessage(e: unknown): string {
  if (e && typeof e === "object" && "data" in e) {
    const data = (e as { data: unknown }).data;
    if (data && typeof data === "object" && data !== null && "message" in data) {
      const m = (data as { message: unknown }).message;
      if (typeof m === "string" && m.trim()) return m;
    }
  }
  if (e instanceof Error) return e.message;
  return "Request failed";
}

function parseNumber(value: FormDataEntryValue | null, fieldName: string) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid number for ${fieldName}`);
  }
  return n;
}

/** Case-insensitive read for SQL/pyodbc row keys */
function rowVal(row: Row | null | undefined, ...candidates: string[]): string {
  if (!row || typeof row !== "object") return "";
  const o = row as Record<string, unknown>;
  for (const wanted of candidates) {
    const wl = wanted.toLowerCase();
    for (const key of Object.keys(o)) {
      if (key.toLowerCase() === wl) {
        const v = o[key];
        if (v == null) return "";
        return String(v);
      }
    }
  }
  return "";
}

function resultId(value: unknown, ...keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  for (const [k, v] of Object.entries(o)) {
    if (!wanted.has(k.toLowerCase())) continue;
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return undefined;
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

  const [farmsInsert, setFarmsInsert] = React.useState<Row[]>([]);
  const [cropsInsert, setCropsInsert] = React.useState<Row[]>([]);
  const [insertLookupsLoading, setInsertLookupsLoading] = React.useState(false);
  const [insertLookupsError, setInsertLookupsError] = React.useState<string | null>(null);
  const [harvestFarmId, setHarvestFarmId] = React.useState("");
  const [harvestCropTypeId, setHarvestCropTypeId] = React.useState("");
  const [harvestIsAvailable, setHarvestIsAvailable] = React.useState("true");

  const [restaurantRows, setRestaurantRows] = React.useState<Row[]>([]);
  const [tripRows, setTripRows] = React.useState<Row[]>([]);
  const [updateTablesLoading, setUpdateTablesLoading] = React.useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<string>("");
  const [selectedTripId, setSelectedTripId] = React.useState<string>("");

  const [orderRows, setOrderRows] = React.useState<Row[]>([]);
  const [batchRows, setBatchRows] = React.useState<Row[]>([]);
  const [deleteListsLoading, setDeleteListsLoading] = React.useState(false);
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>("");
  const [orderDetail, setOrderDetail] = React.useState<Row | null>(null);
  const [orderDeleteConfirm, setOrderDeleteConfirm] = React.useState("");
  const [selectedBatchId, setSelectedBatchId] = React.useState<string>("");
  const [batchDeleteConfirm, setBatchDeleteConfirm] = React.useState("");

  const [inlineErrors, setInlineErrors] = React.useState<Record<string, string>>({});

  const [deliveryWindowDraft, setDeliveryWindowDraft] = React.useState("");
  const [tripDistanceDraft, setTripDistanceDraft] = React.useState("");

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

  React.useEffect(() => {
    if (mainTab !== "insert") return;
    let cancelled = false;
    (async () => {
      setInsertLookupsLoading(true);
      setInsertLookupsError(null);
      try {
        const [fa, cr] = await Promise.all([
          getLookup("/api/farms"),
          getLookup("/api/crop-types"),
        ]);
        if (cancelled) return;
        setFarmsInsert(fa.rows);
        setCropsInsert(cr.rows);
      } catch (e) {
        if (!cancelled) {
          setFarmsInsert([]);
          setCropsInsert([]);
          setInsertLookupsError(extractApiMessage(e));
        }
      } finally {
        if (!cancelled) setInsertLookupsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab]);

  React.useEffect(() => {
    if (mainTab !== "update") return;
    let cancelled = false;
    (async () => {
      setUpdateTablesLoading(true);
      try {
        const [rest, trips] = await Promise.all([
          getLookup("/api/restaurants"),
          getLookup("/api/trips"),
        ]);
        if (cancelled) return;
        setRestaurantRows(rest.rows);
        setTripRows(trips.rows);
      } catch {
        if (!cancelled) {
          setRestaurantRows([]);
          setTripRows([]);
        }
      } finally {
        if (!cancelled) setUpdateTablesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab]);

  React.useEffect(() => {
    if (mainTab !== "delete") return;
    let cancelled = false;
    (async () => {
      setDeleteListsLoading(true);
      try {
        const [orders, batches] = await Promise.all([
          getLookup("/api/orders"),
          getLookup("/api/harvest-batches?available=1"),
        ]);
        if (cancelled) return;
        setOrderRows(orders.rows);
        setBatchRows(batches.rows);
      } catch {
        if (!cancelled) {
          setOrderRows([]);
          setBatchRows([]);
        }
      } finally {
        if (!cancelled) setDeleteListsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mainTab]);

  React.useEffect(() => {
    setOrderDeleteConfirm("");
    if (!selectedOrderId) {
      setOrderDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(
          `${API_BASE}/api/orders/${encodeURIComponent(selectedOrderId)}`
        );
        const text = await res.text();
        const data = text ? safeJson(text) : null;
        if (cancelled) return;
        if (!res.ok) {
          setOrderDetail(null);
          return;
        }
        const row = (data as { row?: Row } | null)?.row;
        setOrderDetail(row && typeof row === "object" ? row : null);
      } catch {
        if (!cancelled) setOrderDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrderId]);

  React.useEffect(() => {
    setBatchDeleteConfirm("");
  }, [selectedBatchId]);

  const selectedRestaurant = React.useMemo(
    () =>
      restaurantRows.find((r) => rowVal(r, "RestaurantID") === selectedRestaurantId),
    [restaurantRows, selectedRestaurantId]
  );

  const selectedTrip = React.useMemo(
    () => tripRows.find((r) => rowVal(r, "TripID") === selectedTripId),
    [tripRows, selectedTripId]
  );

  React.useEffect(() => {
    if (selectedRestaurant) {
      setDeliveryWindowDraft(rowVal(selectedRestaurant, "PreferredDeliveryWindow"));
    } else {
      setDeliveryWindowDraft("");
    }
  }, [selectedRestaurant]);

  React.useEffect(() => {
    if (selectedTrip) {
      setTripDistanceDraft(rowVal(selectedTrip, "TotalDistanceKM"));
    } else {
      setTripDistanceDraft("");
    }
  }, [selectedTrip]);

  const farmInsertOptions = React.useMemo(
    () =>
      farmsInsert.map((row) => {
        const id = rowVal(row, "FarmID");
        return {
          value: id,
          label: `${rowVal(row, "FarmName")} (${id}) — ${rowVal(row, "Location")}`,
        };
      }),
    [farmsInsert]
  );

  const cropInsertOptions = React.useMemo(
    () =>
      cropsInsert.map((row) => {
        const id = rowVal(row, "CropTypeID");
        return {
          value: id,
          label: `${rowVal(row, "CropTypeName")} (${id})`,
        };
      }),
    [cropsInsert]
  );

  const harvestAvailabilityOptions = React.useMemo(
    () => [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    []
  );

  const orderDeleteOptions = React.useMemo(
    () =>
      orderRows.map((row) => {
        const oid = rowVal(row, "OrderID");
        return {
          value: oid,
          label: `${oid} — ${rowVal(row, "RestaurantName")} (${rowVal(row, "OrderDate")})`,
        };
      }),
    [orderRows]
  );

  const batchDeleteOptions = React.useMemo(
    () =>
      batchRows.map((row) => {
        const bid = rowVal(row, "BatchID");
        return {
          value: bid,
          label: `${bid} — ${rowVal(row, "FarmName")} / ${rowVal(row, "CropTypeName")} (${rowVal(row, "HarvestDate")})`,
        };
      }),
    [batchRows]
  );

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

  async function run<T>(fn: () => Promise<T>, opts?: { inlineErrorKey?: string }) {
    const inlineKey = opts?.inlineErrorKey;
    setBusy(true);
    setResult(null);
    setError(null);
    if (inlineKey) {
      setInlineErrors((prev) => {
        const next = { ...prev };
        delete next[inlineKey];
        return next;
      });
    }
    try {
      const data = await fn();
      setResult(data);
    } catch (e) {
      setError(e);
      if (inlineKey) {
        setInlineErrors((prev) => ({
          ...prev,
          [inlineKey]: extractApiMessage(e),
        }));
      }
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
                      const farmRaw = harvestFarmId;
                      const cropRaw = harvestCropTypeId;
                      if (!farmRaw || String(farmRaw).trim() === "") {
                        setInlineErrors((p) => ({
                          ...p,
                          harvest: "Choose a farm from the list.",
                        }));
                        return;
                      }
                      if (!cropRaw || String(cropRaw).trim() === "") {
                        setInlineErrors((p) => ({
                          ...p,
                          harvest: "Choose a crop type from the list.",
                        }));
                        return;
                      }
                      let qty: number;
                      let price: number;
                      try {
                        qty = parseNumber(fd.get("available_quantity_kg"), "AvailableQuantityKG");
                        price = parseNumber(fd.get("price_per_kg"), "PricePerKG");
                      } catch (err) {
                        setInlineErrors((p) => ({
                          ...p,
                          harvest: err instanceof Error ? err.message : "Invalid number.",
                        }));
                        return;
                      }
                      if (qty <= 0 || price <= 0) {
                        setInlineErrors((p) => ({
                          ...p,
                          harvest: "Quantity and price must be greater than zero.",
                        }));
                        return;
                      }
                      run(
                        () =>
                          postJson("/api/harvest-batches", {
                            FarmID: Number(farmRaw),
                            CropTypeID: Number(cropRaw),
                            HarvestDate: String(fd.get("harvest_date")),
                            AvailableQuantityKG: qty,
                            PricePerKG: price,
                            IsAvailable: harvestIsAvailable === "true",
                          }),
                        { inlineErrorKey: "harvest" }
                      );
                    }}
                  >
                    {insertLookupsLoading ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" />
                        Loading farms and crop types…
                      </p>
                    ) : null}
                    {insertLookupsError ? (
                      <p className="text-sm text-destructive" role="alert">
                        {insertLookupsError}
                      </p>
                    ) : null}
                    {!insertLookupsLoading &&
                    !insertLookupsError &&
                    (farmsInsert.length === 0 || cropsInsert.length === 0) ? (
                      <p className="text-xs text-muted-foreground">
                        Farm or crop list is empty. On a new database, run db/schema.sql then
                        db/seed.sql against FarmDB.
                      </p>
                    ) : null}
                    <div className="grid gap-1.5">
                      <Label htmlFor="farm_id">Farm</Label>
                      <CrudSelectDropdown
                        id="farm_id"
                        value={harvestFarmId}
                        onValueChange={setHarvestFarmId}
                        options={farmInsertOptions}
                        placeholder="Choose a farm…"
                        disabled={busy || insertLookupsLoading}
                        emptyLabel="No farms loaded"
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="crop_type_id">Crop type</Label>
                      <CrudSelectDropdown
                        id="crop_type_id"
                        value={harvestCropTypeId}
                        onValueChange={setHarvestCropTypeId}
                        options={cropInsertOptions}
                        placeholder="Choose a crop type…"
                        disabled={busy || insertLookupsLoading}
                        emptyLabel="No crop types loaded"
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
                      <CrudSelectDropdown
                        id="is_available"
                        value={harvestIsAvailable}
                        onValueChange={setHarvestIsAvailable}
                        options={harvestAvailabilityOptions}
                        placeholder="Is available"
                        disabled={busy}
                      />
                    </div>
                    {inlineErrors.harvest ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.harvest}
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      disabled={
                        busy ||
                        insertLookupsLoading ||
                        farmsInsert.length === 0 ||
                        cropsInsert.length === 0
                      }
                    >
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
                      const first = String(fd.get("first_name") ?? "").trim();
                      const last = String(fd.get("last_name") ?? "").trim();
                      const phone = String(fd.get("phone") ?? "").trim();
                      if (!first || !last || !phone) {
                        setInlineErrors((p) => ({
                          ...p,
                          driver: "First name, last name, and phone are required.",
                        }));
                        return;
                      }
                      if (first.length > 50 || last.length > 50) {
                        setInlineErrors((p) => ({
                          ...p,
                          driver: "Names must be at most 50 characters.",
                        }));
                        return;
                      }
                      if (phone.length > 20) {
                        setInlineErrors((p) => ({
                          ...p,
                          driver: "Phone must be at most 20 characters.",
                        }));
                        return;
                      }
                      run(
                        () =>
                          postJson("/api/drivers", {
                            FirstName: first,
                            LastName: last,
                            Phone: phone,
                          }),
                        { inlineErrorKey: "driver" }
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        placeholder="Ahmed"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        placeholder="Hassan"
                        required
                        maxLength={50}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="01001234567"
                        required
                        maxLength={20}
                      />
                    </div>
                    {inlineErrors.driver ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.driver}
                      </p>
                    ) : null}
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="update" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Update Restaurant Delivery Window</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pick a row from the table, adjust the delivery window, then submit. The API
                    only updates{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                      PreferredDeliveryWindow
                    </code>
                    .
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {updateTablesLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading restaurants…
                    </p>
                  ) : null}
                  <DynamicDataTable
                    rows={restaurantRows}
                    onRowClick={(r) => setSelectedRestaurantId(rowVal(r, "RestaurantID"))}
                    isRowSelected={(r) => rowVal(r, "RestaurantID") === selectedRestaurantId}
                  />
                  {selectedRestaurant ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">Selected restaurant</p>
                      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <div>
                          <dt className="inline font-medium text-foreground">ID: </dt>
                          <dd className="inline font-mono">{selectedRestaurantId}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Name: </dt>
                          <dd className="inline">{rowVal(selectedRestaurant, "RestaurantName")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">City: </dt>
                          <dd className="inline">{rowVal(selectedRestaurant, "City")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Current window: </dt>
                          <dd className="inline font-mono">
                            {rowVal(selectedRestaurant, "PreferredDeliveryWindow") || "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click a row in the table above to choose a restaurant.
                    </p>
                  )}
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedRestaurantId.trim()) {
                        setInlineErrors((p) => ({
                          ...p,
                          updateRestaurant: "Select a restaurant from the table first.",
                        }));
                        return;
                      }
                      const w = deliveryWindowDraft.trim();
                      if (!w) {
                        setInlineErrors((p) => ({
                          ...p,
                          updateRestaurant: "Preferred delivery window cannot be empty.",
                        }));
                        return;
                      }
                      run(
                        () =>
                          putJson(
                            `/api/restaurants/${encodeURIComponent(selectedRestaurantId)}/delivery-window`,
                            { PreferredDeliveryWindow: w }
                          ),
                        { inlineErrorKey: "updateRestaurant" }
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="preferred_delivery_window">Preferred Delivery Window</Label>
                      <Input
                        id="preferred_delivery_window"
                        name="preferred_delivery_window"
                        placeholder="10:00-14:00"
                        value={deliveryWindowDraft}
                        onChange={(e) => setDeliveryWindowDraft(e.target.value)}
                        required
                      />
                    </div>
                    {inlineErrors.updateRestaurant ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.updateRestaurant}
                      </p>
                    ) : null}
                    <Button type="submit" disabled={busy || !selectedRestaurantId}>
                      Submit update
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Update Trip Distance</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Pick a trip row, edit total distance (kilometres, zero or more), then submit.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {updateTablesLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading trips…
                    </p>
                  ) : null}
                  <DynamicDataTable
                    rows={tripRows}
                    onRowClick={(r) => setSelectedTripId(rowVal(r, "TripID"))}
                    isRowSelected={(r) => rowVal(r, "TripID") === selectedTripId}
                  />
                  {selectedTrip ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">Selected trip</p>
                      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <div>
                          <dt className="inline font-medium text-foreground">TripID: </dt>
                          <dd className="inline font-mono">{selectedTripId}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Driver: </dt>
                          <dd className="inline">{rowVal(selectedTrip, "DriverName")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Date: </dt>
                          <dd className="inline font-mono">{rowVal(selectedTrip, "TripDate")}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Click a row in the table above to choose a trip.
                    </p>
                  )}
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedTripId.trim()) {
                        setInlineErrors((p) => ({
                          ...p,
                          updateTrip: "Select a trip from the table first.",
                        }));
                        return;
                      }
                      const dist = Number(tripDistanceDraft);
                      if (Number.isNaN(dist) || dist < 0) {
                        setInlineErrors((p) => ({
                          ...p,
                          updateTrip: "Total distance must be a number greater than or equal to 0.",
                        }));
                        return;
                      }
                      run(
                        () =>
                          putJson(`/api/trips/${encodeURIComponent(selectedTripId)}/route`, {
                            TotalDistanceKM: dist,
                          }),
                        { inlineErrorKey: "updateTrip" }
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="total_distance_km">Total Distance (KM)</Label>
                      <Input
                        id="total_distance_km"
                        name="total_distance_km"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="42.5"
                        value={tripDistanceDraft}
                        onChange={(e) => setTripDistanceDraft(e.target.value)}
                        required
                      />
                    </div>
                    {inlineErrors.updateTrip ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.updateTrip}
                      </p>
                    ) : null}
                    <Button type="submit" disabled={busy || !selectedTripId}>
                      Submit update
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="delete" className="mt-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Delete Order</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose an order, confirm by typing its Order ID, then delete. This cannot be
                    undone.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deleteListsLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading orders…
                    </p>
                  ) : null}
                  <div className="grid gap-1.5">
                    <Label htmlFor="delete_order_select">Order</Label>
                    <CrudSelectDropdown
                      id="delete_order_select"
                      value={selectedOrderId}
                      onValueChange={setSelectedOrderId}
                      options={orderDeleteOptions}
                      placeholder="Select an order…"
                      disabled={busy || deleteListsLoading || orderRows.length === 0}
                      emptyLabel="No orders loaded"
                    />
                  </div>
                  {orderDetail ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      <p className="font-medium">Preflight (GET /api/orders/…)</p>
                      <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                        <div>
                          <dt className="inline font-medium text-foreground">OrderID: </dt>
                          <dd className="inline font-mono">{rowVal(orderDetail, "OrderID")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Restaurant: </dt>
                          <dd className="inline">{rowVal(orderDetail, "RestaurantName")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">City: </dt>
                          <dd className="inline">{rowVal(orderDetail, "City")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Order date: </dt>
                          <dd className="inline font-mono">{rowVal(orderDetail, "OrderDate")}</dd>
                        </div>
                        <div>
                          <dt className="inline font-medium text-foreground">Status: </dt>
                          <dd className="inline">{rowVal(orderDetail, "Status")}</dd>
                        </div>
                      </dl>
                    </div>
                  ) : selectedOrderId ? (
                    <p className="text-sm text-muted-foreground">
                      Loading order details or order not found.
                    </p>
                  ) : null}
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedOrderId) {
                        setInlineErrors((p) => ({
                          ...p,
                          deleteOrder: "Select an order from the list.",
                        }));
                        return;
                      }
                      if (orderDeleteConfirm.trim() !== selectedOrderId) {
                        setInlineErrors((p) => ({
                          ...p,
                          deleteOrder: `Type the Order ID exactly (${selectedOrderId}) to confirm.`,
                        }));
                        return;
                      }
                      run(
                        () => del(`/api/orders/${encodeURIComponent(selectedOrderId)}`),
                        { inlineErrorKey: "deleteOrder" }
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="order_delete_confirm">Confirm Order ID</Label>
                      <Input
                        id="order_delete_confirm"
                        name="order_delete_confirm"
                        placeholder="Type Order ID to confirm"
                        value={orderDeleteConfirm}
                        onChange={(e) => setOrderDeleteConfirm(e.target.value)}
                        autoComplete="off"
                        aria-invalid={orderDeleteConfirm !== selectedOrderId && orderDeleteConfirm.length > 0}
                      />
                    </div>
                    {inlineErrors.deleteOrder ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.deleteOrder}
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={
                        busy ||
                        !selectedOrderId ||
                        orderDeleteConfirm.trim() !== selectedOrderId
                      }
                    >
                      Delete order
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Remove Harvest Batch</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    The server only deletes batches where{" "}
                    <code className="rounded bg-muted px-1 py-0.5 text-xs">IsAvailable = 1</code>.
                    The picker is limited to those rows so an invalid ID is unlikely.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deleteListsLoading ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading eligible batches…
                    </p>
                  ) : null}
                  <div className="grid gap-1.5">
                    <Label htmlFor="delete_batch_select">Available batch</Label>
                    <CrudSelectDropdown
                      id="delete_batch_select"
                      value={selectedBatchId}
                      onValueChange={setSelectedBatchId}
                      options={batchDeleteOptions}
                      placeholder="Select a batch…"
                      disabled={busy || deleteListsLoading || batchRows.length === 0}
                      emptyLabel="No eligible batches"
                    />
                  </div>
                  {selectedBatchId ? (
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                      {(() => {
                        const row = batchRows.find((r) => rowVal(r, "BatchID") === selectedBatchId);
                        if (!row) return null;
                        return (
                          <>
                            <p className="font-medium">Selected batch</p>
                            <dl className="mt-2 grid gap-1 text-xs text-muted-foreground">
                              <div>
                                <dt className="inline font-medium text-foreground">BatchID: </dt>
                                <dd className="inline font-mono">{rowVal(row, "BatchID")}</dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-foreground">Farm: </dt>
                                <dd className="inline">{rowVal(row, "FarmName")}</dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-foreground">Crop: </dt>
                                <dd className="inline">{rowVal(row, "CropTypeName")}</dd>
                              </div>
                              <div>
                                <dt className="inline font-medium text-foreground">Available: </dt>
                                <dd className="inline">{rowVal(row, "IsAvailable")}</dd>
                              </div>
                            </dl>
                          </>
                        );
                      })()}
                    </div>
                  ) : null}
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!selectedBatchId) {
                        setInlineErrors((p) => ({
                          ...p,
                          deleteBatch: "Select a batch from the list.",
                        }));
                        return;
                      }
                      if (batchDeleteConfirm.trim() !== selectedBatchId) {
                        setInlineErrors((p) => ({
                          ...p,
                          deleteBatch: `Type the Batch ID exactly (${selectedBatchId}) to confirm.`,
                        }));
                        return;
                      }
                      run(
                        () => del(`/api/harvest-batches/${encodeURIComponent(selectedBatchId)}`),
                        { inlineErrorKey: "deleteBatch" }
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="batch_delete_confirm">Confirm Batch ID</Label>
                      <Input
                        id="batch_delete_confirm"
                        name="batch_delete_confirm"
                        placeholder="Type Batch ID to confirm"
                        value={batchDeleteConfirm}
                        onChange={(e) => setBatchDeleteConfirm(e.target.value)}
                        autoComplete="off"
                        aria-invalid={
                          batchDeleteConfirm !== selectedBatchId && batchDeleteConfirm.length > 0
                        }
                      />
                    </div>
                    {inlineErrors.deleteBatch ? (
                      <p className="text-sm text-destructive" role="alert">
                        {inlineErrors.deleteBatch}
                      </p>
                    ) : null}
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={
                        busy ||
                        !selectedBatchId ||
                        batchDeleteConfirm.trim() !== selectedBatchId
                      }
                    >
                      Remove batch
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
                  {resultId(result, "BatchID") || resultId(result, "DriverID") ? (
                    <p className="mb-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                      Assigned identifiers:{" "}
                      {resultId(result, "BatchID") ? (
                        <>
                          BatchID{" "}
                          <span className="font-mono font-semibold">
                            {resultId(result, "BatchID")}
                          </span>
                        </>
                      ) : null}
                      {resultId(result, "BatchID") && resultId(result, "DriverID") ? " · " : null}
                      {resultId(result, "DriverID") ? (
                        <>
                          DriverID{" "}
                          <span className="font-mono font-semibold">
                            {resultId(result, "DriverID")}
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
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

