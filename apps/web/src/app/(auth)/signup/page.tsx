"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";

const initialState: ActionState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpAction, initialState);

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-primary">Create your workspace</h1>
      <p className="mb-5 text-sm text-text-secondary">Adapt the ERP to your business.</p>

      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Your name" htmlFor="fullName" required>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </FormField>
        <FormField label="Company name" htmlFor="companyName" required>
          <Input id="companyName" name="companyName" required placeholder="Demo Company (Pvt) Ltd" />
        </FormField>
        <FormField label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField label="Password" htmlFor="password" required hint="At least 8 characters">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <Button type="submit" loading={isPending} className="w-full">
          Create workspace
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
