// Print-friendly route group: no sidebar/topbar chrome, just the document.
// Auth is still enforced inside each page via requireOrgContext().
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white text-slate-900">{children}</div>;
}
