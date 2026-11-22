"use server";

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type FormState } from "@/lib/validation";

export async function iniciarSesion(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  if (!getSupabaseEnv()) {
    return { error: "El servicio no está configurado por ahora. Inténtalo más tarde.", values };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      return { error: "Correo o contraseña incorrectos.", values };
    }
  } catch {
    return { error: "Ocurrió un problema al ingresar. Inténtalo de nuevo.", values };
  }

  redirect("/panel");
}