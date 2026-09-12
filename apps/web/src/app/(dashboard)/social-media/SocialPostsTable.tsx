import { Share2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { SocialPostRow } from "@/services/socialMedia";

const STATUS_TONE: Record<SocialPostRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  scheduled: "warning",
  queued: "warning",
  published: "success",
  failed: "danger",
};

export function SocialPostsTable({ posts }: { posts: SocialPostRow[] }) {
  return (
    <Card>
      {posts.length === 0 ? (
        <EmptyState icon={Share2} title="No posts yet" description="Compose a post to queue it for publishing." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Platforms</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Created</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{p.title}</td>
                <td className="px-4 py-2.5 capitalize text-text-secondary">{p.platforms.join(", ")}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
