import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-full">
      <SiteHeader active="home" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-balance text-4xl">FarmDB</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Introduction to Database Systems
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-5">
              <div className="md:col-span-3">
                <div className="space-y-2">
                  <div className="text-lg font-semibold">
                    Project Phase 3 | Physical ERD
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Project 12: The Regional Farm-to-Table Distribution
                  </div>

                  <div className="pt-2 text-sm">
                    <div>
                      <span className="font-medium">TA:</span> Lamiaa Atef
                    </div>
                    <div>
                      <span className="font-medium">Section:</span> S 33 - 34
                    </div>
                    <div>
                      <span className="font-medium">Project ID:</span> 36
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="flex flex-wrap gap-3">
                  <Link href="/crud" className={cn(buttonVariants({ variant: "default" }))}>
                    Open CRUD
                  </Link>
                  <Link href="/reports" className={cn(buttonVariants({ variant: "outline" }))}>
                    Open Reports
                  </Link>
                </div>
              </div>

              <div className="md:col-span-2">
                <Card className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Team</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            Yehia Hassan Abdelmoaty Hassan
                          </TableCell>
                          <TableCell className="text-right font-mono">20242447</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Marina Emad Sobhy</TableCell>
                          <TableCell className="text-right font-mono">20240782</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Jana Ahmed Farahat Hassan
                          </TableCell>
                          <TableCell className="text-right font-mono">20240759</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Noha Mohamed Ahmed</TableCell>
                          <TableCell className="text-right font-mono">20240794</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Hana Khaled Abdelhamed
                          </TableCell>
                          <TableCell className="text-right font-mono">20240650</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">
                            Sohila Maher Shebat-Elhamd
                          </TableCell>
                          <TableCell className="text-right font-mono">20242174</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
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
