import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationBell } from "@/components/NotificationBell";
import { UserMenu } from "@/components/UserMenu";
import type { NotificationRow } from "@/services/notifications";

export function TopBar({
  userName,
  roleName,
  notifications,
}: {
  userName: string;
  roleName: string;
  notifications: NotificationRow[];
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell notifications={notifications} />
        <UserMenu name={userName} roleName={roleName} />
      </div>
    </header>
  );
}
