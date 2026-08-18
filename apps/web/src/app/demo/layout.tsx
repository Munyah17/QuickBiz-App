import { DemoProvider } from "@/lib/demo/DemoContext";
import { ToastProvider } from "@/components/Toast";
import { DemoSidebar, DemoTopBar } from "./DemoNav";

// Deliberately outside the (dashboard) route group: no auth, no Supabase,
// no server actions anywhere under /demo. State lives entirely in
// DemoProvider's React state and disappears on refresh, by design.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ToastProvider>
        <div className="flex h-screen w-full overflow-hidden bg-workspace">
          <DemoSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <DemoTopBar />
            <main className="flex-1 overflow-y-auto p-6">{children}</main>
          </div>
        </div>
      </ToastProvider>
    </DemoProvider>
  );
}
