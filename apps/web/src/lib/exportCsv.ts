// Client-side CSV export — the data driving these tables is already fully
// loaded in the browser (server-fetched once, filtered client-side), so
// exporting it is just formatting + a Blob download, no server round-trip
// or new endpoint needed.
export function exportToCsv(filename: string, rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]!);
  const escape = (value: string | number) => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(","))];
  const csv = lines.join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
