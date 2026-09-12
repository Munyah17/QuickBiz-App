"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createIncidentAction, initialSheqActionState } from "./actions";

const INCIDENT_TYPES = ["injury", "illness", "near_miss", "property_damage", "environmental", "security", "fire", "other"];
const SEVERITIES = ["minor", "moderate", "major", "critical"];

function NewIncidentForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createIncidentAction, initialSheqActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Incident reported");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="Report Incident">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Incident Type" htmlFor="incidentType">
          <Select id="incidentType" name="incidentType" defaultValue={INCIDENT_TYPES[0]}>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Severity" htmlFor="severity">
          <Select id="severity" name="severity" defaultValue={SEVERITIES[0]}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Title" htmlFor="title">
          <Input id="title" name="title" required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" required />
        </FormField>

        <FormField label="Date Occurred" htmlFor="dateOccurred">
          <Input id="dateOccurred" name="dateOccurred" type="date" required />
        </FormField>

        <FormField label="Location" htmlFor="location">
          <Input id="location" name="location" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Report Incident
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewIncidentModal() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Report Incident
      </Button>
      {open && <NewIncidentForm onClose={() => setOpen(false)} />}
    </>
  );
}
