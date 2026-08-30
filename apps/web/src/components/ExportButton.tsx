"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/Button";
import { exportToCsv } from "@/lib/exportCsv";

export function ExportButton({ filename, rows }: { filename: string; rows: Array<Record<string, string | number>> }) {
  return (
    <Button variant="secondary" size="sm" disabled={rows.length === 0} onClick={() => exportToCsv(filename, rows)}>
      <Download className="size-4" />
      Export
    </Button>
  );
}
