"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

export default function DemoCompanyPage() {
  const { orgName, updateOrgName } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState(orgName);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Company" />

      <Card className="max-w-lg">
        <CardHeader title="Organization profile" />
        <form
          className="flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            updateOrgName(name.trim());
            push("Company profile updated");
          }}
        >
          <FormField label="Organization name" htmlFor="name" required>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="Currency" htmlFor="currency">
            <Input id="currency" defaultValue="USD" disabled />
          </FormField>
          <div className="flex justify-end">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
