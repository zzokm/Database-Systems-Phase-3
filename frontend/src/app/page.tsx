import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-full">
      <SiteHeader active="home" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-balance text-3xl">
              Regional Farm-to-Table Distribution
            </CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Phase 3 web UI: CRUD operations + 6 analytical inquiries. Backend is
              Flask (raw SQL) against externally hosted MS SQL Server.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/crud" className={cn(buttonVariants({ variant: "default" }))}>
                Open CRUD
              </Link>
              <Link
                href="/reports"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Open Reports
              </Link>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CRUD</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Straightforward forms to trigger required INSERT / UPDATE / DELETE
                  endpoints.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reports</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  One-click report runners for the 6 JOIN-based analytical inquiries.
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
