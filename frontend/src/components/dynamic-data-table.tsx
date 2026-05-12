import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCell, type Row } from "@/lib/table-view";

export function DynamicDataTable({ rows }: { rows: Row[] }) {
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
                  <span className="font-mono text-xs">{formatCell(r?.[c])}</span>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
