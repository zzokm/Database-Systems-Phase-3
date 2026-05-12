"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ERD_SVG = "/docs/PhysicalERD.svg";
const ERD_JPG = "/docs/PhysicalERD.jpg";

/** Scale factor: 1 = baseline; can go very small for a dot or large to read text */
const MIN_SCALE = 0.015;
const MAX_SCALE = 12;

function clampScale(s: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

export default function ErdPage() {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);

  const [scale, setScale] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  const scaleRef = React.useRef(scale);
  const panRef = React.useRef(pan);
  React.useEffect(() => {
    scaleRef.current = scale;
    panRef.current = pan;
  }, [scale, pan]);

  const dragRef = React.useRef<{
    active: boolean;
    pointerId: number;
    lastX: number;
    lastY: number;
  }>({ active: false, pointerId: 0, lastX: 0, lastY: 0 });

  const centerOnViewport = React.useCallback(() => {
    const vp = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img) return;
    const vpW = vp.clientWidth;
    const vpH = vp.clientHeight;
    const iw = img.offsetWidth;
    const ih = img.offsetHeight;
    const s = scaleRef.current;
    setPan({
      x: vpW / 2 - (iw * s) / 2,
      y: vpH / 2 - (ih * s) / 2,
    });
  }, []);

  const onImageLoad = React.useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        centerOnViewport();
      });
    });
  }, [centerOnViewport]);

  React.useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      onImageLoad();
    }
  }, [onImageLoad]);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const s = scaleRef.current;
      const p = panRef.current;

      const isPinchZoom = e.ctrlKey;

      if (isPinchZoom) {
        const zoomFactor = Math.exp(-e.deltaY * 0.02);
        const newScale = clampScale(s * zoomFactor);
        const ratio = newScale / s;
        const newPanX = mx - (mx - p.x) * ratio;
        const newPanY = my - (my - p.y) * ratio;
        setScale(newScale);
        setPan({ x: newPanX, y: newPanY });
        return;
      }

      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.shiftKey && dx === 0 && dy !== 0) {
        dx = dy;
        dy = 0;
      }
      if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        const line = 18;
        dx *= line;
        dy *= line;
      } else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
        const page = Math.max(rect.width, rect.height);
        dx *= page;
        dy *= page;
      }

      setPan((prev) => ({
        x: prev.x - dx,
        y: prev.y - dy,
      }));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    };
  }, []);

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const endDrag = React.useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    dragRef.current = { ...d, active: false };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }, []);

  const downloadJpg = React.useCallback(() => {
    const a = document.createElement("a");
    a.href = ERD_JPG;
    a.download = "PhysicalERD.jpg";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  return (
    <div className="min-h-full">
      <SiteHeader active="erd" />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Physical ERD</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Two-finger scroll moves the diagram. Pinch on the trackpad (or Ctrl + scroll) zooms in
            and out. You can still drag to pan.
          </p>
        </div>

        <Separator className="my-6" />

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">
                Physical entity-relationship diagram
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-2"
                title="PhysicalERD.jpg"
                onClick={downloadJpg}
              >
                <Download className="size-4" aria-hidden />
                Download
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Physical ERD: tables, columns, primary and foreign keys, and how entities connect
              (farms and crops, harvest batches, restaurants and orders, drivers and trips, and
              associative tables such as order lines and trip orders).
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              ref={viewportRef}
              role="application"
              aria-label="Pan and zoom physical entity-relationship diagram"
              tabIndex={0}
              className={cn(
                "relative h-[min(75vh,calc(100dvh-14rem))] w-full touch-none select-none",
                "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-inner ring-1 ring-foreground/5",
                "cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <div
                className="will-change-transform"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                  transformOrigin: "0 0",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- pan/zoom transform; public SVG */}
                <img
                  ref={imgRef}
                  src={ERD_SVG}
                  alt="Physical database ERD: Farms, CropTypes, HarvestBatches, Restaurants, Orders, OrderDetails, Drivers, Trips, TripOrders, and relationships."
                  draggable={false}
                  onLoad={onImageLoad}
                  className="pointer-events-none block h-auto max-w-none bg-card"
                  style={{ width: "min(92vw, 1280px)" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
