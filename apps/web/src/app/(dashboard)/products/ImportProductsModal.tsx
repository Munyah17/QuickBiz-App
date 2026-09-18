"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { importProductsAction, initialImportActionState } from "./actions";
import type { ProductInput } from "@/services/products";

// Expected header: sku,name,category,cost_price,selling_price,reorder_level,unit_of_measure
// Column order is read from the header row, so any order/subset works as
// long as sku + name are present.
function parseCsv(text: string): { rows: ProductInput[]; error: string | null } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return { rows: [], error: "Paste CSV text with a header row and at least one data row." };

  const [headerLine = "", ...dataLines] = lines;
  const header = (headerLine ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (name: string) => header.indexOf(name);
  if (col("sku") === -1 || col("name") === -1) {
    return { rows: [], error: "The header must include at least `sku` and `name` columns." };
  }

  const rows: ProductInput[] = [];
  for (const line of dataLines) {
    // Simple CSV split — quoted commas aren't supported; strip quotes instead.
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (name: string) => (col(name) >= 0 ? (cells[col(name)] ?? "") : "");
    rows.push({
      sku: get("sku"),
      name: get("name"),
      description: get("description"),
      categoryName: get("category"),
      unit_of_measure: get("unit_of_measure") || get("uom") || "each",
      cost_price: Number(get("cost_price") || get("cost") || 0) || 0,
      selling_price: Number(get("selling_price") || get("price") || 0) || 0,
      reorder_level: Number(get("reorder_level") || get("reorder") || 0) || 0,
      barcode: get("barcode"),
    });
  }
  return { rows, error: null };
}

const EXAMPLE = `sku,name,category,cost_price,selling_price,reorder_level,unit_of_measure
BEV-COLA-330,Cola 330ml Can,Beverages,0.55,1.00,24,ea
GRO-RICE-5K,Long Grain Rice 5kg,Groceries,4.20,6.50,10,ea`;

export function ImportProductsModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(importProductsAction, initialImportActionState);
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<ProductInput[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const { push } = useToast();

  useEffect(() => {
    if (state.result) {
      const r = state.result;
      push(`Imported ${r.created} product${r.created === 1 ? "" : "s"}${r.skipped ? `, skipped ${r.skipped} existing` : ""}${r.failed ? `, ${r.failed} failed` : ""}`);
      onClose();
    }
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.result, state.error]);

  function onFile(file: File | undefined) {
    if (!file) return;
    file.text().then(setCsv);
  }

  function buildPreview() {
    const { rows, error } = parseCsv(csv);
    setParseError(error);
    setPreview(error ? null : rows);
  }

  const invalid = preview?.filter((r) => !r.sku || !r.name).length ?? 0;

  return (
    <Modal open onClose={onClose} title="Import products from CSV">
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-surface-subtle px-3 py-2 text-xs text-text-secondary">
          <p className="font-medium text-text-primary">Expected columns</p>
          <code className="block pt-1">sku,name,category,cost_price,selling_price,reorder_level,unit_of_measure</code>
          <p className="pt-1">Rows with a SKU that already exists are skipped — safe to re-run.</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-subtle px-3 py-1.5 text-sm text-text-primary hover:bg-surface-subtle">
            <Upload className="size-4" />
            Choose .csv file
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={() => setCsv(EXAMPLE)} className="text-sm text-primary-600 hover:underline">
            Use example
          </button>
        </div>

        <textarea
          value={csv}
          onChange={(e) => {
            setCsv(e.target.value);
            setPreview(null);
          }}
          rows={7}
          placeholder="Paste CSV text here…"
          className="w-full rounded-md border border-border-subtle bg-surface px-3 py-2 font-mono text-xs text-text-primary"
        />

        {parseError && <p className="text-sm text-danger-600">{parseError}</p>}

        {preview === null ? (
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={buildPreview} disabled={!csv.trim()}>
              Preview import
            </Button>
          </div>
        ) : (
          <>
            <div className="max-h-56 overflow-auto rounded-md border border-border-subtle">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-left font-medium uppercase tracking-wide text-text-tertiary">
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className={`border-b border-border-subtle last:border-b-0 ${!r.sku || !r.name ? "bg-danger-50" : ""}`}>
                      <td className="px-3 py-1.5 text-text-secondary">{r.sku || "—"}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.name || "—"}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.categoryName || "—"}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.cost_price}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.selling_price}</td>
                      <td className="px-3 py-1.5 text-text-secondary">{r.reorder_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invalid > 0 && <p className="text-sm text-danger-600">{invalid} row{invalid === 1 ? " is" : "s are"} missing a sku or name and will fail.</p>}
            <form action={formAction} className="flex justify-end gap-2">
              <input type="hidden" name="rows" value={JSON.stringify(preview)} />
              <Button type="button" variant="secondary" onClick={() => setPreview(null)}>
                Back
              </Button>
              <Button type="submit" loading={isPending}>
                Import {preview.length} product{preview.length === 1 ? "" : "s"}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
