"use client";

import * as React from "react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicApiBaseUrl } from "@/lib/api-base";

const FETCH_TIMEOUT_MS = 30_000;

const API_BASE = getPublicApiBaseUrl();

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

function parseNumber(value: FormDataEntryValue | null, fieldName: string) {
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`Invalid number for ${fieldName}`);
  }
  return n;
}

export default function CrudPage() {
  const [result, setResult] = React.useState<unknown>(null);
  const [error, setError] = React.useState<unknown>(null);
  const [busy, setBusy] = React.useState(false);

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
            <p className="mt-1 text-sm text-muted-foreground">
              Simple forms to trigger required operations. Endpoint paths can be
              aligned with the backend as you implement it.
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            API: <span className="font-mono">{API_BASE}</span>
          </div>
        </div>

        <Separator className="my-6" />

        <Tabs defaultValue="insert" className="w-full">
          <TabsList>
            <TabsTrigger value="insert">INSERT</TabsTrigger>
            <TabsTrigger value="update">UPDATE</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
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
                          farm_id: parseNumber(fd.get("farm_id"), "farm_id"),
                          crop_type_id: parseNumber(fd.get("crop_type_id"), "crop_type_id"),
                          harvest_date: String(fd.get("harvest_date")),
                          quantity: parseNumber(fd.get("quantity"), "quantity"),
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
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" name="quantity" type="number" min={0} required />
                    </div>
                    <Button type="submit" disabled={busy}>
                      Submit
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Register Driver</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    className="grid gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      run(() =>
                        postJson("/api/drivers", {
                          name: String(fd.get("name")),
                          phone: String(fd.get("phone") || ""),
                          license_no: String(fd.get("license_no")),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="name">Driver Name</Label>
                      <Input id="name" name="name" placeholder="Ahmed Ali" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" name="phone" placeholder="0100..." />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="license_no">License No</Label>
                      <Input id="license_no" name="license_no" placeholder="LIC-12345" required />
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
                          delivery_window: String(fd.get("delivery_window")),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="restaurant_id">Restaurant ID</Label>
                      <Input id="restaurant_id" name="restaurant_id" placeholder="5" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="delivery_window">Preferred Window</Label>
                      <Input
                        id="delivery_window"
                        name="delivery_window"
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
                  <CardTitle>Update Trip Route</CardTitle>
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
                          route: String(fd.get("route")),
                        })
                      );
                    }}
                  >
                    <div className="grid gap-1.5">
                      <Label htmlFor="trip_id">Trip ID</Label>
                      <Input id="trip_id" name="trip_id" placeholder="12" required />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="route">Route</Label>
                      <Input id="route" name="route" placeholder="Farm → Restaurant" required />
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
                  <CardTitle>Cancel Order</CardTitle>
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
                  <JsonBox value={error} />
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

