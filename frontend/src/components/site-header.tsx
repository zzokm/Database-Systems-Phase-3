import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function SiteHeader({ active }: { active?: "home" | "crud" | "reports" }) {
  return (
    <header className="w-full border-b bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            FT
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Farm-to-Table</div>
            <div className="text-xs text-muted-foreground">Phase 3</div>
          </div>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <Badge variant="secondary">Flask • MSSQL • Raw SQL</Badge>
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

