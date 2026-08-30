import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listTickets } from "@/services/tickets";
import { listCustomers } from "@/services/customers";
import { NewTicketModal } from "./NewTicketModal";
import { TicketsTable } from "./TicketsTable";

export default async function TicketsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "service_management");
  const canManage = permissions.has("service.manage");

  const { data: member } = await supabase.from("org_members").select("branch_id").eq("status", "active").limit(1).maybeSingle();
  const [tickets, customers] = await Promise.all([listTickets(supabase, orgId), listCustomers(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Service Tickets" />
        {canManage && (
          <NewTicketModal customers={customers.filter((c) => c.is_active)} branchId={(member?.branch_id as string) ?? ""} />
        )}
      </div>

      <TicketsTable tickets={tickets} canManage={canManage} />
    </div>
  );
}
