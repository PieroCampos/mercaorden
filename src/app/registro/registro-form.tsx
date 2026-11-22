"use client";

import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import { registrar } from "@/app/registro/actions";
import type { FormState } from "@/lib/validation";

const inicial: FormState = {};

export function RegistroForm() {
  const [state, action] = useActionState(registrar, inicial);
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="rounded-lg border bg-muted p-3 text-sm">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="role" className="text-sm font-medium">
          Tipo de cuenta
        </label>
        <select
          id="role"
          name="role"
          defaultValue={v.role ?? "comerciante"}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="comerciante">Comerciante (requiere aprobación del administrador)</option>
          <option value="transportista">Transportista (aprobado al registrarte)</option>
        </select>
        {fe.role?.[0] ? <p className="text-xs text-destructive">{fe.role[0]}</p> : null}
      </div>

      <FormField name="full_name" label="Nombre completo" defaultValue={v.full_name} errors={fe.full_name} autoComplete="name" />
      <FormField name="doc_number" label="DNI o RUC" defaultValue={v.doc_number} errors={fe.doc_number} inputMode="numeric" hint="8 dígitos para DNI, 11 para RUC." />
      <FormField name="business_name" label="Nombre del negocio" defaultValue={v.business_name} errors={fe.business_name} autoComplete="organization" />
      <FormField name="business_type" label="Giro del negocio" defaultValue={v.business_type} errors={fe.business_type} />
      <FormField name="email" label="Correo electrónico" type="email" defaultValue={v.email} errors={fe.email} autoComplete="email" />
      <FormField name="password" label="Contraseña" type="password" errors={fe.password} autoComplete="new-password" hint="Mínimo 8 caracteres." />

      <SubmitButton pendingText="Creando cuenta...">Crear cuenta</SubmitButton>
    </form>
  );
}