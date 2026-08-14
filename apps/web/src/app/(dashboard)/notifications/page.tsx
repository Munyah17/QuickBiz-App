import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { listNotifications } from "@/services/notifications";
import { NotificationsList } from "./NotificationsList";

export default async function NotificationsPage() {
  const { supabase } = await requireOrgContext();
  const notifications = await listNotifications(supabase, 100);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Account" title="Notifications" />
      <NotificationsList notifications={notifications} />
    </div>
  );
}
