"use client";

import { useActionState, useState } from "react";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { createApiKey, revokeApiKey, initialDevActionState } from "../../actions";
import type { ApiKeyRow } from "@/services/developers";

export function KeysManager({ keys }: { keys: ApiKeyRow[] }) {
  const { push } = useToast();
  const [state, formAction, isPending] = useActionState(createApiKey, initialDevActionState);
  const [showForm, setShowForm] = useState(false);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    push("Copied to clipboard");
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {state.newKey && (
        <Card className="border-success-300 bg-success-50 p-4">
          <p className="text-sm font-medium text-success-700">Your new API key — copy it now, it won't be shown again:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded bg-white px-3 py-2 font-mono text-xs">{state.newKey}</code>
            <Button type="button" variant="secondary" size="sm" onClick={() => copy(state.newKey!)}>
              <Copy className="size-4" />
            </Button>
          </div>
        </Card>
      )}
      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
      {state.success && !state.newKey && <p className="text-sm text-success-600">{state.success}</p>}

      <div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" />
          New API key
        </Button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form action={formAction} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Key name</label>
              <Input name="name" required placeholder="e.g. Production module, Test integration" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">Scope</label>
              <Select name="scope" defaultValue="public">
                <option value="public">Public — module integration (access licensed orgs)</option>
                <option value="private">Private — B2B (your own organization only)</option>
              </Select>
            </div>
            <Button type="submit" loading={isPending} className="self-start">
              Create key
            </Button>
          </form>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Your keys</h3>
        {keys.length === 0 ? (
          <p className="text-sm text-text-tertiary">No API keys yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-md border border-border-subtle px-3 py-2">
                <KeyRound className="size-4 shrink-0 text-text-tertiary" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">
                    {k.name}
                    <span className="ml-2 rounded bg-workspace px-1.5 py-0.5 text-[10px] font-medium uppercase text-text-tertiary">
                      {k.scope}
                    </span>
                    {k.status === "revoked" && (
                      <span className="ml-2 rounded bg-danger-50 px-1.5 py-0.5 text-[10px] font-medium uppercase text-danger-600">
                        revoked
                      </span>
                    )}
                  </p>
                  <p className="font-mono text-xs text-text-tertiary">
                    {k.prefix}… · created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt ? ` · last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : " · never used"}
                  </p>
                </div>
                {k.status === "active" && (
                  <button
                    type="button"
                    onClick={() => void revokeApiKey(k.id)}
                    className="text-text-tertiary hover:text-danger-600"
                    title="Revoke key"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
