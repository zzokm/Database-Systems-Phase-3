export type Row = Record<string, unknown>;

export function formatCell(v: unknown) {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function columnKeys(rows: Row[]): string[] {
  if (!rows?.length) return [];
  const keys = new Set<string>();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => keys.add(k)));
  return Array.from(keys).sort();
}

function toSortableNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function compareCell(a: unknown, b: unknown): number {
  const an = toSortableNumber(a);
  const bn = toSortableNumber(b);
  if (an !== null && bn !== null && an !== bn) return an < bn ? -1 : 1;
  if (an !== null && bn === null) return -1;
  if (an === null && bn !== null) return 1;
  return formatCell(a).localeCompare(formatCell(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export type SliceMode = "all" | "top" | "bottom";

export const SLICE_MODE_LABEL: Record<SliceMode, string> = {
  all: "All",
  top: "Top N",
  bottom: "Bottom N",
};

export function applyTableView(
  rows: Row[],
  opts: {
    sortKey: string;
    sortDir: "asc" | "desc";
    sliceMode: SliceMode;
    sliceN: number;
  }
): Row[] {
  const out = rows.map((r) => ({ ...r }));
  const keys = columnKeys(out);
  const key = opts.sortKey && keys.includes(opts.sortKey) ? opts.sortKey : keys[0];
  if (key) {
    out.sort((a, b) => {
      const c = compareCell(a[key], b[key]);
      return opts.sortDir === "asc" ? c : -c;
    });
  }
  const n = Math.max(1, Math.floor(opts.sliceN));
  const cap = Math.min(n, out.length);
  if (opts.sliceMode === "top") return out.slice(0, cap);
  if (opts.sliceMode === "bottom") return out.slice(Math.max(0, out.length - cap));
  return out;
}
