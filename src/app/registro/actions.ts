"use server";

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { registroSchema, type FormState } from "@/lib/validation";

const CAMPOS = ["role", "full_name", "doc_number", "business_name", "business_type", "email"] as const;

export async function registrar(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(
    [...CAMPOS, "password"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  const values = Object.fromEntries(CAMPOS.map((k) => [k, raw[k]]));

  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  if (!getSupabaseEnv()) {
    return {
      error: "El servicio no está configurado por ahora. Inténtalo más tarde.",
      values,
    };
  }

  const { email, password, ...datos } = parsed.data;
  const duplicado: FormState = {
    fieldErrors: { email: ["Este correo ya está registrado. Inicia sesión."] },
    values,
  };

  let hayCorreoPorConfirmar = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: datos },
    });

    if (error) {
      if (error.code === "user_already_exists") {
        return duplicado;
      }
      return { error: "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.", values };
    }

    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return duplicado;
    }

    hayCorreoPorConfirmar = !data.session;
  } catch {
    return { error: "Ocurrió un problema al registrarte. Inténtalo de nuevo.", values };
  }

  if (hayCorreoPorConfirmar) {
    return {
      message: "Te enviamos un correo de confirmación. Revisa tu bandeja y confirma tu cuenta para ingresar.",
      values: {},
    };
  }

  redirect("/panel");
}