"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { iniciarSesion } from "@/app/login/actions";
import type { FormState } from "@/lib/validation";

const inicial: FormState = {};

export function LoginForm() {
  const [state, action] = useActionState(iniciarSesion, inicial);
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <FormField name="email" label="Correo electrónico" type="email" defaultValue={state.values?.email} errors={fe.email} autoComplete="email" />
      <FormField name="password" label="Contraseña" type="password" errors={fe.password} autoComplete="current-password" />
      <SubmitButton pendingText="Ingresando...">Ingresar</SubmitButton>
    </form>
  );
}