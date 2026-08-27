import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getCustomCode, listCustomCodeVersions } from "@/services/customCode";
import { CodeEditor } from "./CodeEditor";

const PLANNED_LANGUAGES = [
  {
    key: "js",
    name: "Custom JS",
    reason: "JavaScript in an authenticated page can read the acting user's own session and data - it needs a genuinely isolated execution context (e.g. a sandboxed iframe with no access to the parent app) before it's safe to ship, not just a text box.",
  },
  {
    key: "php",
    name: "Custom PHP",
    reason: "This stack has no PHP runtime. Running it would mean standing up a separate, isolated execution service - real infrastructure, not a feature we fake with a save button.",
  },
  {
    key: "python",
    name: "Custom Python",
    reason: "Same as PHP: arbitrary code execution needs a genuinely sandboxed runtime (isolated containers, resource limits) that doesn't exist yet.",
  },
];

export default async function CustomCodePage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "custom_code");
  const canManage = permissions.has("custom_code.manage");

  const [entries, cssVersions, htmlVersions] = await Promise.all([
    getCustomCode(supabase, orgId),
    listCustomCodeVersions(supabase, orgId, "css"),
    listCustomCodeVersions(supabase, orgId, "html"),
  ]);

  const css = entries.find((e) => e.codeType === "css");
  const html = entries.find((e) => e.codeType === "html");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Appearance" title="Custom Code" />
      <p className="-mt-4 text-sm text-text-secondary">
        Custom CSS applies across your whole QuickBiz workspace immediately after saving. Custom HTML renders in a
        sandboxed preview here (no script ever executes, even if pasted in) - wiring it into a specific page is
        future work. Every save is versioned, and any past version can be restored.
      </p>

      <Card>
        <CardHeader title="Custom CSS" action={<Badge tone="success">Active</Badge>} />
        <div className="p-4">
          <CodeEditor codeType="css" initialContent={css?.content ?? ""} initialVersion={css?.version ?? 0} versions={cssVersions} canManage={canManage} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Custom HTML" action={<Badge tone="success">Active</Badge>} />
        <div className="p-4">
          <CodeEditor
            codeType="html"
            initialContent={html?.content ?? ""}
            initialVersion={html?.version ?? 0}
            versions={htmlVersions}
            canManage={canManage}
            showPreview
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANNED_LANGUAGES.map((lang) => (
          <Card key={lang.key} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-text-primary">{lang.name}</p>
              <Badge tone="neutral">Planned</Badge>
            </div>
            <p className="text-xs text-text-tertiary">{lang.reason}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
