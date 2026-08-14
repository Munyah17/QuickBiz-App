"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Paintbrush, RotateCcw } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";
import { HEX_PATTERN, DEFAULT_THEME_COLOR } from "@/lib/theme";
import { updateThemeColorAction, initialCompanyActionState } from "./actions";

const PRESETS = [
  { name: "Blue (default)", hex: DEFAULT_THEME_COLOR },
  { name: "Green", hex: "#16A34A" },
  { name: "Purple", hex: "#7C3AED" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Orange", hex: "#EA580C" },
  { name: "Red", hex: "#DC2626" },
  { name: "Pink", hex: "#DB2777" },
  { name: "Slate", hex: "#334155" },
];

function PresetSwatchForm({
  hex,
  name,
  active,
  disabled,
}: {
  hex: string;
  name: string;
  active: boolean;
  disabled: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateThemeColorAction, initialCompanyActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(`Theme set to ${name}`);
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="hexColor" value={hex} />
      <button
        type="submit"
        disabled={isPending || disabled}
        title={name}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border-2 transition-transform disabled:cursor-not-allowed disabled:opacity-50",
          !disabled && "hover:scale-105",
          active ? "border-text-primary" : "border-transparent"
        )}
        style={{ backgroundColor: hex }}
      >
        {active && <Check className="size-4 text-white drop-shadow" />}
      </button>
    </form>
  );
}

function HexModal({
  open,
  onClose,
  currentColor,
}: {
  open: boolean;
  onClose: () => void;
  currentColor: string;
}) {
  const [state, formAction, isPending] = useActionState(updateThemeColorAction, initialCompanyActionState);
  // No effect needed to reset `hex` on open: the parent remounts this
  // component (via `key`) each time the modal opens, so `currentColor` is
  // always the fresh initial value here.
  const [hex, setHex] = useState(currentColor);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Theme color updated");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  const valid = HEX_PATTERN.test(hex);

  return (
    <Modal open={open} onClose={onClose} title="Custom theme color">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="hexColor" value={hex} />

        <FormField label="Pick a color" htmlFor="color-swatch">
          <div className="flex items-center gap-3">
            <input
              id="color-swatch"
              type="color"
              value={valid ? hex : "#000000"}
              onChange={(e) => setHex(e.target.value.toUpperCase())}
              className="size-11 shrink-0 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
            />
            <Input
              value={hex}
              onChange={(e) => setHex(e.target.value.toUpperCase())}
              placeholder="#2563EB"
              maxLength={7}
              className="font-mono uppercase"
            />
          </div>
          {!valid && <p className="mt-1 text-xs text-danger-500">Enter a 6-digit hex code, e.g. #2563EB</p>}
        </FormField>

        <div className="flex items-center gap-2 rounded-md border border-border p-3">
          <div className="size-8 rounded-md" style={{ backgroundColor: valid ? hex : "#e5e7eb" }} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-text-primary">Preview</p>
            <p className="truncate text-xs text-text-secondary">Sidebar and buttons will use this color.</p>
          </div>
        </div>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending} disabled={!valid}>
            Apply theme
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ThemeColorPicker({ currentColor, canManage }: { currentColor: string | null; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const resetFormRef = useRef<HTMLFormElement>(null);
  const effectiveColor = currentColor ?? DEFAULT_THEME_COLOR;
  const isPreset = PRESETS.some((p) => p.hex.toUpperCase() === effectiveColor.toUpperCase());

  const [resetState, resetAction, resetPending] = useActionState(updateThemeColorAction, initialCompanyActionState);
  const { push } = useToast();

  useEffect(() => {
    if (resetState.success) push("Theme reset to default");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetState.success]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {PRESETS.map((preset) => (
          <PresetSwatchForm
            key={preset.hex}
            hex={preset.hex}
            name={preset.name}
            active={preset.hex.toUpperCase() === effectiveColor.toUpperCase()}
            disabled={!canManage}
          />
        ))}

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!canManage}
          title="Custom color"
          className={cn(
            "flex size-9 items-center justify-center rounded-full border-2 border-dashed disabled:cursor-not-allowed disabled:opacity-50",
            !isPreset ? "border-text-primary" : "border-border"
          )}
          style={!isPreset ? { backgroundColor: effectiveColor } : undefined}
        >
          {!isPreset ? <Check className="size-4 text-white drop-shadow" /> : <Paintbrush className="size-4 text-text-tertiary" />}
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-text-secondary">
        <span className="font-mono">{effectiveColor.toUpperCase()}</span>
        {currentColor && canManage && (
          <form ref={resetFormRef} action={resetAction}>
            <input type="hidden" name="hexColor" value="" />
            <button
              type="submit"
              disabled={resetPending}
              className="inline-flex items-center gap-1 font-medium text-primary-600 hover:underline disabled:opacity-50"
            >
              <RotateCcw className="size-3.5" />
              Reset to default
            </button>
          </form>
        )}
      </div>

      {!canManage && <p className="text-xs text-text-tertiary">Only Owner/Admin can change the organization theme.</p>}

      {/* key forces a fresh mount (and fresh `hex` initial state) every time
          the modal opens, instead of resetting it via an effect. */}
      {canManage && modalOpen && (
        <HexModal
          key={effectiveColor}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          currentColor={effectiveColor}
        />
      )}
    </div>
  );
}
