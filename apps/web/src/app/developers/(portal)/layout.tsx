import { ToastProvider } from "@/components/Toast";
import { requireDeveloper } from "@/lib/developer-session";
import { DeveloperNav } from "../DeveloperNav";

export default async function DevelopersLayout({ children }: { children: React.ReactNode }) {
  const { developer } = await requireDeveloper();

  return (
    <ToastProvider>
      <div className="flex h-screen w-full overflow-hidden bg-workspace">
        <DeveloperNav developerName={developer.displayName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
