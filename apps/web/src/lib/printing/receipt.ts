import { EscPosEncoder } from "./escpos";

// Transport-agnostic receipt model — the POS receipt, kitchen tickets, and
// any future thermal output all build one of these, then pick a transport.
export interface ReceiptLine {
  description: string;
  quantity: number;
  lineTotal: number;
}

export interface ReceiptPayment {
  label: string;
  amount: number;
}

export interface ReceiptData {
  orgName: string;
  title?: string; // e.g. "Sales Receipt", "Tax Invoice"
  receiptNumber?: string;
  date?: string;
  cashier?: string;
  branch?: string;
  customer?: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount?: { amount: number; reason?: string };
  tax?: { label: string; amount: number };
  total: number;
  payments: ReceiptPayment[];
  amountTendered?: number;
  changeDue?: number;
  barcode?: string; // printed as CODE128 under the totals
  footer?: string;
  currency?: string; // defaults to "$"
}

export type PaperWidth = 58 | 80;

function columnsFor(width: PaperWidth): number {
  return width === 58 ? 32 : 48;
}

function money(value: number, currency = "$"): string {
  return `${currency}${value.toFixed(2)}`;
}

/** Build the ESC/POS byte stream for a receipt. */
export function buildReceiptEscPos(data: ReceiptData, paperWidth: PaperWidth = 80): Uint8Array {
  const w = columnsFor(paperWidth);
  const cur = data.currency ?? "$";
  const enc = new EscPosEncoder();

  enc.init();

  // Header — org name double-size centered.
  enc.align("center").size(2, 2).line(data.orgName).size(1, 1);
  if (data.title) enc.line(data.title);
  enc.rule("=", w);

  // Meta block.
  enc.align("left");
  if (data.receiptNumber) enc.columns("Receipt #", data.receiptNumber, w);
  if (data.date) enc.columns("Date", data.date, w);
  if (data.cashier) enc.columns("Cashier", data.cashier, w);
  if (data.branch) enc.columns("Branch", data.branch, w);
  if (data.customer) enc.columns("Customer", data.customer, w);
  enc.rule("-", w);

  // Line items.
  for (const line of data.lines) {
    enc.columns(`${line.quantity} x ${line.description}`, money(line.lineTotal, cur), w);
  }
  enc.rule("-", w);

  // Totals.
  enc.columns("Subtotal", money(data.subtotal, cur), w);
  if (data.discount && data.discount.amount > 0) {
    enc.columns(
      `Discount${data.discount.reason ? ` (${data.discount.reason})` : ""}`,
      `-${money(data.discount.amount, cur)}`,
      w
    );
  }
  if (data.tax && data.tax.amount > 0) {
    enc.columns(data.tax.label, money(data.tax.amount, cur), w);
  }
  enc.bold(true).size(1, 2).columns("TOTAL", money(data.total, cur), w).size(1, 1).bold(false);
  enc.rule("-", w);

  // Payments.
  if (data.payments.length > 0) {
    for (const p of data.payments) enc.columns(p.label, money(p.amount, cur), w);
  } else {
    enc.columns("Paid via", "Not recorded", w);
  }
  if (data.amountTendered !== undefined) enc.columns("Tendered", money(data.amountTendered, cur), w);
  if (data.changeDue && data.changeDue > 0) {
    enc.bold(true).columns("Change", money(data.changeDue, cur), w).bold(false);
  }

  // Optional barcode (receipt number for returns lookup).
  if (data.barcode) {
    enc.feed(1).align("center").barcode(data.barcode, 73, 50);
  }

  // Footer.
  enc.align("center").feed(1).line(data.footer ?? "Thank you for your business");
  enc.cut();

  return enc.encode();
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Build a self-contained HTML document for browser printing of a receipt. */
export function buildReceiptHtml(data: ReceiptData, paperWidth: PaperWidth = 80): string {
  const cur = data.currency ?? "$";
  const mm = paperWidth === 58 ? "58mm" : "72mm"; // printable width on 80mm paper
  const rows = data.lines
    .map(
      (l) =>
        `<tr><td>${l.quantity} x ${esc(l.description)}</td><td class="r">${money(l.lineTotal, cur)}</td></tr>`
    )
    .join("");
  const payRows =
    data.payments.length > 0
      ? data.payments.map((p) => `<tr><td>${esc(p.label)}</td><td class="r">${money(p.amount, cur)}</td></tr>`).join("")
      : `<tr><td>Paid via</td><td class="r">Not recorded</td></tr>`;

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Receipt</title>
<style>
  @page { size: ${paperWidth}mm auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${mm}; margin: 0 auto; padding: 4mm 2mm; font-family: "Courier New", monospace; font-size: 11px; color: #000; }
  .c { text-align: center; }
  .name { font-size: 15px; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .r { text-align: right; white-space: nowrap; }
  .rule { border-top: 1px dashed #000; margin: 4px 0; }
  .total td { font-weight: bold; font-size: 13px; }
  .foot { margin-top: 6px; font-size: 10px; }
</style></head><body>
  <div class="c"><div class="name">${esc(data.orgName)}</div>${data.title ? `<div>${esc(data.title)}</div>` : ""}</div>
  <div class="rule"></div>
  <table>
    ${data.receiptNumber ? `<tr><td>Receipt #</td><td class="r">${esc(data.receiptNumber)}</td></tr>` : ""}
    ${data.date ? `<tr><td>Date</td><td class="r">${esc(data.date)}</td></tr>` : ""}
    ${data.cashier ? `<tr><td>Cashier</td><td class="r">${esc(data.cashier)}</td></tr>` : ""}
    ${data.branch ? `<tr><td>Branch</td><td class="r">${esc(data.branch)}</td></tr>` : ""}
    ${data.customer ? `<tr><td>Customer</td><td class="r">${esc(data.customer)}</td></tr>` : ""}
  </table>
  <div class="rule"></div>
  <table>${rows}</table>
  <div class="rule"></div>
  <table>
    <tr><td>Subtotal</td><td class="r">${money(data.subtotal, cur)}</td></tr>
    ${data.discount && data.discount.amount > 0 ? `<tr><td>Discount${data.discount.reason ? ` (${esc(data.discount.reason)})` : ""}</td><td class="r">-${money(data.discount.amount, cur)}</td></tr>` : ""}
    ${data.tax && data.tax.amount > 0 ? `<tr><td>${esc(data.tax.label)}</td><td class="r">${money(data.tax.amount, cur)}</td></tr>` : ""}
    <tr class="total"><td>TOTAL</td><td class="r">${money(data.total, cur)}</td></tr>
  </table>
  <div class="rule"></div>
  <table>
    ${payRows}
    ${data.amountTendered !== undefined ? `<tr><td>Tendered</td><td class="r">${money(data.amountTendered, cur)}</td></tr>` : ""}
    ${data.changeDue && data.changeDue > 0 ? `<tr><td><b>Change</b></td><td class="r"><b>${money(data.changeDue, cur)}</b></td></tr>` : ""}
  </table>
  <div class="c foot">${esc(data.footer ?? "Thank you for your business")}</div>
</body></html>`;
}
