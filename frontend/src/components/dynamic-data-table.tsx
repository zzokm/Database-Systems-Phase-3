import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCell, type Row } from "@/lib/table-view";
import { cn } from "@/lib/utils";

export function DynamicDataTable({
  rows,
  onRowClick,
  isRowSelected,
}: {
  rows: Row[];
  onRowClick?: (row: Row) => void;
  isRowSelected?: (row: Row) => boolean;
}) {
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
            <TableRow
              key={idx}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                isRowSelected?.(r) && "bg-muted/70"
              )}
              onClick={() => onRowClick?.(r)}
            >
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
