import { DemoProvider } from "@/lib/demo/DemoContext";
import { ToastProvider } from "@/components/Toast";
import { DemoShell } from "./DemoShell";

// Deliberately outside the (dashboard) route group: no auth, no Supabase,
// no server actions anywhere under /demo. State lives entirely in
// DemoProvider's React state and disappears on refresh, by design.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ToastProvider>
        <DemoShell>{children}</DemoShell>
      </ToastProvider>
    </DemoProvider>
  );
}
