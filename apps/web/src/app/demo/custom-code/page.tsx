"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { useDemo, type CustomCodeType } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";
import { CustomHtmlPreview } from "@/app/(dashboard)/custom-code/CustomHtmlPreview";

const PLANNED_LANGUAGES = [
  { key: "js", name: "Custom JS", reason: "Needs a genuinely isolated execution context before it's safe to ship - not just a text box." },
  { key: "php", name: "Custom PHP", reason: "This stack has no PHP runtime - would need a separate, isolated execution service." },
  { key: "python", name: "Custom Python", reason: "Same as PHP: needs a genuinely sandboxed runtime that doesn't exist yet." },
];

function DemoCodeEditor({ codeType, showPreview }: { codeType: CustomCodeType; showPreview?: boolean }) {
  const { customCode, saveCustomCode, rollbackCustomCode } = useDemo();
  const { push } = useToast();
  const entry = customCode[codeType];
  const [draft, setDraft] = useState(entry.content);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        spellCheck={false}
        className="w-full rounded-md border border-border bg-white p-3 font-mono text-xs text-text-primary focus:outline-none"
        placeholder={codeType === "css" ? "/* your CSS here */" : "<!-- your HTML here -->"}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">Current version: {entry.version}</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowHistory((v) => !v)}>
            <History className="size-4" />
            History ({entry.history.length})
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              saveCustomCode(codeType, draft);
              push(`Saved as version ${entry.version + 1}`);
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {showPreview && (
        <div>
          <p className="mb-1 text-xs font-medium text-text-tertiary">Preview (sandboxed, scripts never run)</p>
          <CustomHtmlPreview content={draft} />
        </div>
      )}

      {showHistory && (
        <div className="rounded-md border border-border-subtle">
          {entry.history.length === 0 ? (
            <p className="p-3 text-sm text-text-tertiary">No saved versions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {entry.history.map((v) => (
                <li key={v.version} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div>
                    <p className="text-text-primary">
                      Version {v.version}
                      {v.version === entry.version && <span className="ml-2 text-xs text-success-600">(current)</span>}
                    </p>
                    <p className="text-xs text-text-tertiary">{new Date(v.createdAt).toLocaleString()}</p>
                  </div>
                  {v.version !== entry.version && (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        rollbackCustomCode(codeType, v.version);
                        setDraft(v.content);
                        push("Rolled back to a previous version");
                      }}
                    >
                      Rollback to this
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function DemoCustomCodePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Appearance" title="Custom Code" />
      <p className="-mt-4 text-sm text-text-secondary">
        Custom HTML renders in a sandboxed preview here (no script ever executes, even if pasted in). Every save is
        versioned, and any past version can be restored.
      </p>

      <Card>
        <CardHeader title="Custom CSS" action={<Badge tone="success">Active</Badge>} />
        <div className="p-4">
          <DemoCodeEditor codeType="css" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Custom HTML" action={<Badge tone="success">Active</Badge>} />
        <div className="p-4">
          <DemoCodeEditor codeType="html" showPreview />
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
