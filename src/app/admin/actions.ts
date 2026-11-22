"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid, validateRejectionReason } from "@/lib/admin";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

async function updateStatus(id: string, values: { status: "aprobado" | "rechazado"; rejection_reason: string | null }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", id)
    .eq("role", "comerciante")
    .eq("status", "pendiente")
    .select("id");

  if (error) {
    fail("No se pudo actualizar la solicitud. Inténtalo nuevamente.");
  }
  if (!data || data.length !== 1) {
    fail("La solicitud ya no está pendiente o no existe.");
  }
  revalidatePath("/admin");
}

export async function aprobarSolicitud(formData: FormData) {
  await requireRole(["admin"]);
  const id = formData.get("id");
  if (!isUuid(id)) {
    fail("Identificador de solicitud no válido.");
  }
  await updateStatus(id, { status: "aprobado", rejection_reason: null });
  redirect("/admin?ok=aprobado");
}

export async function rechazarSolicitud(formData: FormData) {
  await requireRole(["admin"]);
  const id = formData.get("id");
  if (!isUuid(id)) {
    fail("Identificador de solicitud no válido.");
  }
  const motivo = validateRejectionReason(formData.get("motivo"));
  if (!motivo.ok) {
    fail(motivo.error);
  }
  await updateStatus(id, { status: "rechazado", rejection_reason: motivo.value });
  redirect("/admin?ok=rechazado");
}
