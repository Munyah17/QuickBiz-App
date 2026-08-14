import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext } from "@/lib/session";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { user, userName } = await requireOrgContext();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Account" title="My Profile" />
      <ProfileForm fullName={userName} email={user.email ?? ""} />
    </div>
  );
}
