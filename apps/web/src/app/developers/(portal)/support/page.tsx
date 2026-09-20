import { PageHeader } from "@/components/PageHeader";
import { requireDeveloper } from "@/lib/developer-session";
import { listSupportTickets } from "@/services/developers";
import { SupportManager } from "./SupportManager";

export default async function DeveloperSupportPage() {
  const { supabase, developer } = await requireDeveloper();
  const tickets = await listSupportTickets(supabase, developer.id);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Support" />
      <SupportManager tickets={tickets} />
    </div>
  );
}
