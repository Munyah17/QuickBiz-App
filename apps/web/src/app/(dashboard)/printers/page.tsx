import { PageHeader } from "@/components/PageHeader";
import { PrinterSettings } from "./PrinterSettings";

export default function PrintersPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Printers" />
      <PrinterSettings />
    </div>
  );
}
