"use client";

import * as React from "react";

import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPublicApiBaseUrl } from "@/lib/api-base";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: "home" | "crud" | "reports" }) {
  const [state, setState] = React.useState<
    | { kind: "checking" }
    | { kind: "down" }
    | { kind: "backend-up"; db: "up" | "down" }
  >({ kind: "checking" });

  React.useEffect(() => {
    let cancelled = false;
    const base = getPublicApiBaseUrl();

    async function check() {
      try {
        // 1) Backend reachability (no DB required)
        const healthRes = await fetch(`${base}/health`, { cache: "no-store" });
        if (!healthRes.ok) throw new Error(`HTTP ${healthRes.status}`);
        const health = (await healthRes.json()) as { status?: string };
        if (health?.status !== "ok") throw new Error("health not ok");

        // 2) DB readiness (can fail even if backend is up)
        try {
          const readyRes = await fetch(`${base}/ready`, { cache: "no-store" });
          if (!readyRes.ok) throw new Error(`HTTP ${readyRes.status}`);
          const readyJson = (await readyRes.json()) as {
            status?: string;
            db?: { ok?: number };
          };
          const dbOk = readyJson?.status === "ok" && readyJson?.db?.ok === 1;
          if (!cancelled) setState({ kind: "backend-up", db: dbOk ? "up" : "down" });
        } catch {
          if (!cancelled) setState({ kind: "backend-up", db: "down" });
        }
      } catch {
        if (!cancelled) setState({ kind: "down" });
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusLabel =
    state.kind === "checking"
      ? "Checking backend…"
      : state.kind === "down"
        ? "Backend offline"
        : state.db === "up"
          ? "SQL connected"
          : "Backend online · DB offline";

  const statusDotClass =
    state.kind === "checking"
      ? "bg-amber-500"
      : state.kind === "down"
        ? "bg-rose-500"
        : state.db === "up"
          ? "bg-emerald-500"
          : "bg-amber-500";

  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <div className="font-semibold">FarmDB</div>
            <div className="text-xs text-muted-foreground">
              Regional Farm-to-Table Distribution · Phase 3
            </div>
          </div>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", statusDotClass)} />
            <span className="whitespace-nowrap">{statusLabel}</span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            aria-current={active === "home" ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: active === "home" ? "default" : "ghost",
                size: "sm",
              })
            )}
          >
            Home
          </Link>
          <Link
            href="/crud"
            aria-current={active === "crud" ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: active === "crud" ? "default" : "ghost",
                size: "sm",
              })
            )}
          >
            CRUD
          </Link>
          <Link
            href="/reports"
            aria-current={active === "reports" ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: active === "reports" ? "default" : "ghost",
                size: "sm",
              })
            )}
          >
            Reports
          </Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}

