"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, type ActionState } from "@/app/actions/auth";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";

const initialState: ActionState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <>
      <h1 className="mb-1 text-lg font-semibold text-text-primary">Sign in</h1>
      <p className="mb-5 text-sm text-text-secondary">Welcome back to your workspace.</p>

      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </FormField>
        <FormField label="Password" htmlFor="password" required>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <Button type="submit" loading={isPending} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-text-secondary">
        No account?{" "}
        <Link href="/signup" className="font-medium text-primary-600 hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}
