"use client";

import { useActionState, useEffect, useState } from "react";
import { History } from "lucide-react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { saveCustomCodeAction, rollbackCustomCodeAction, initialCustomCodeActionState } from "./actions";
import { CustomHtmlPreview } from "./CustomHtmlPreview";
import type { CustomCodeType, CustomCodeVersion } from "@/services/customCode";

export function CodeEditor({
  codeType,
  initialContent,
  initialVersion,
  versions,
  canManage,
  showPreview,
}: {
  codeType: CustomCodeType;
  initialContent: string;
  initialVersion: number;
  versions: CustomCodeVersion[];
  canManage: boolean;
  showPreview?: boolean;
}) {
  const [content, setContent] = useState(initialContent);
  const [showHistory, setShowHistory] = useState(false);
  const [saveState, saveAction, isSaving] = useActionState(saveCustomCodeAction, initialCustomCodeActionState);
  const [rollbackState, rollbackAction, isRollingBack] = useActionState(rollbackCustomCodeAction, initialCustomCodeActionState);
  const { push } = useToast();

  useEffect(() => {
    if (saveState.success) push(`Saved as version ${initialVersion + 1}`);
    if (saveState.error) push(saveState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState.success, saveState.error]);

  useEffect(() => {
    if (rollbackState.success) push("Rolled back to a previous version");
    if (rollbackState.error) push(rollbackState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollbackState.success, rollbackState.error]);

  return (
    <div className="flex flex-col gap-3">
      <form action={saveAction} className="flex flex-col gap-3">
        <input type="hidden" name="codeType" value={codeType} />
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={!canManage}
          rows={10}
          spellCheck={false}
          className="w-full rounded-md border border-border bg-white p-3 font-mono text-xs text-text-primary focus:outline-none disabled:bg-workspace disabled:text-text-tertiary"
          placeholder={codeType === "css" ? "/* your CSS here */" : "<!-- your HTML here -->"}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-tertiary">Current version: {initialVersion}</span>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowHistory((v) => !v)}>
              <History className="size-4" />
              History ({versions.length})
            </Button>
            {canManage && (
              <Button type="submit" size="sm" loading={isSaving}>
                Save
              </Button>
            )}
          </div>
        </div>
      </form>

      {showPreview && (
        <div>
          <p className="mb-1 text-xs font-medium text-text-tertiary">Preview (sandboxed, scripts never run)</p>
          <CustomHtmlPreview content={content} />
        </div>
      )}

      {showHistory && (
        <div className="rounded-md border border-border-subtle">
          {versions.length === 0 ? (
            <p className="p-3 text-sm text-text-tertiary">No saved versions yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle">
              {versions.map((v) => (
                <li key={v.version} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-text-primary">
                      Version {v.version}
                      {v.version === initialVersion && <span className="ml-2 text-xs text-success-600">(current)</span>}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(v.createdAt).toLocaleString()} {v.createdByName ? `- ${v.createdByName}` : ""}
                    </p>
                  </div>
                  {canManage && v.version !== initialVersion && (
                    <form action={rollbackAction}>
                      <input type="hidden" name="codeType" value={codeType} />
                      <input type="hidden" name="targetVersion" value={v.version} />
                      <Button type="submit" size="sm" variant="secondary" loading={isRollingBack}>
                        Rollback to this
                      </Button>
                    </form>
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
