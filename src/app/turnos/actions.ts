"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import {
  bookingErrorMessage,
  classifyBookingError,
  isBookableDate,
  isUuid,
  normalizePlate,
  suggestAlternativeSlot,
} from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";
import type { SlotAvailability } from "@/lib/types";

export type ReservarState = {
  ok: boolean;
  message: string;
} | null;

export async function reservarTurno(
  _prev: ReservarState,
  formData: FormData,
): Promise<ReservarState> {
  const profile = await requireRole(["transportista"]);

  const slotId = formData.get("slot_id");
  const fecha = formData.get("fecha");
  const plate = normalizePlate(formData.get("plate"));

  if (!isUuid(slotId)) {
    return { ok: false, message: "La franja seleccionada no es válida." };
  }
  if (!plate) {
    return {
      ok: false,
      message: "Ingresa una placa válida, por ejemplo ABC-123.",
    };
  }
  if (!isBookableDate(fecha)) {
    return { ok: false, message: "La fecha no es válida o ya pasó." };
  }

  const supabase = await createClient();

  const { data: slot } = await supabase
    .from("time_slots")
    .select("id, slot_date")
    .eq("id", slotId)
    .maybeSingle();

  if (!slot || slot.slot_date !== fecha) {
    return { ok: false, message: "La franja no corresponde a esa fecha." };
  }

  const { data: existing, error: readError } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("slot_id", slotId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (readError) {
    return { ok: false, message: bookingErrorMessage("desconocido") };
  }

  if (existing?.status === "confirmado") {
    return { ok: false, message: bookingErrorMessage("duplicado") };
  }

  const result = existing
    ? await supabase
        .from("bookings")
        .update({ status: "confirmado", plate })
        .eq("id", existing.id)
        .eq("profile_id", profile.id)
    : await supabase
        .from("bookings")
        .insert({ slot_id: slotId, profile_id: profile.id, plate });

  if (result.error) {
    const kind = classifyBookingError(result.error);
    let suggestion: SlotAvailability | null = null;

    if (kind === "sin_cupo") {
      const [{ data: slots }, { data: mine }] = await Promise.all([
        supabase.rpc("get_slot_availability", { p_slot_date: fecha }),
        supabase
          .from("bookings")
          .select("slot_id")
          .eq("profile_id", profile.id)
          .eq("status", "confirmado"),
      ]);
      suggestion = suggestAlternativeSlot(
        (slots as SlotAvailability[] | null) ?? [],
        slotId,
        (mine ?? []).map((b: { slot_id: string }) => b.slot_id),
      );
    }

    return { ok: false, message: bookingErrorMessage(kind, suggestion) };
  }

  revalidatePath("/turnos");
  return { ok: true, message: `Turno confirmado con la placa ${plate}.` };
}
