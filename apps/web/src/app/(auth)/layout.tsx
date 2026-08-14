import { Package } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-workspace px-4">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">QuickBiz ERP</span>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-card">{children}</div>
    </div>
  );
}
