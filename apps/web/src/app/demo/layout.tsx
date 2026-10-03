import Script from "next/script";
import { DemoProvider } from "@/lib/demo/DemoContext";
import { ToastProvider } from "@/components/Toast";
import { DemoShell } from "./DemoShell";
import "@/styles/cooladmin/index.css";

// Deliberately outside the (dashboard) route group: no auth, no Supabase,
// no server actions anywhere under /demo. State lives entirely in
// DemoProvider's React state and disappears on refresh, by design.
// The CoolAdmin shell + assets are shared with the paid app so the demo
// UI/UX is identical — only persistence is missing.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <ToastProvider>
        <link
          rel="stylesheet"
          href="/cooladmin/vendor/fontawesome-7.3.1/css/all.min.css"
        />
        <Script src="/cooladmin/js/vanilla-utils.js" strategy="afterInteractive" />
        <Script src="/cooladmin/vendor/bootstrap-5.3.8.bundle.min.js" strategy="afterInteractive" />
        <Script src="/cooladmin/js/bootstrap5-init.js" strategy="afterInteractive" />
        <DemoShell>{children}</DemoShell>
      </ToastProvider>
    </DemoProvider>
  );
}
