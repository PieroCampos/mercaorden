import type { SlotAvailability } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Fecha de hoy en Lima (YYYY-MM-DD). */
export function todayInLima(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Devuelve la placa con formato ABC-123, o null si no es válida. */
export function normalizePlate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const compact = raw.toUpperCase().replace(/[\s-]/g, "");
  if (!/^[A-Z][A-Z0-9][A-Z]\d{3}$/.test(compact)) return null;
  return `${compact.slice(0, 3)}-${compact.slice(3)}`;
}

export function isValidPlate(raw: unknown): boolean {
  return normalizePlate(raw) !== null;
}

/** Valida que sea una fecha real YYYY-MM-DD. */
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

/** Fecha real y no anterior a hoy en Lima. */
export function isBookableDate(
  value: unknown,
  now: Date = new Date(),
): boolean {
  return isValidDateString(value) && value >= todayInLima(now);
}

/** Fecha válida y no pasada, o la de hoy en Lima. */
export function resolveDate(value: unknown, now: Date = new Date()): string {
  return typeof value === "string" && isBookableDate(value, now)
    ? value
    : todayInLima(now);
}

export type BookCheck =
  | { ok: true }
  | { ok: false; reason: "sin_cupo" | "duplicado" };

/** Verifica cupo y duplicado con los datos leídos (el trigger da la garantía final). */
export function canBook(
  slot: Pick<SlotAvailability, "slot_id" | "available">,
  bookedSlotIds: readonly string[],
): BookCheck {
  if (bookedSlotIds.includes(slot.slot_id)) {
    return { ok: false, reason: "duplicado" };
  }
  if (slot.available <= 0) {
    return { ok: false, reason: "sin_cupo" };
  }
  return { ok: true };
}

function minutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Franja con cupo más cercana en hora, sin la llena ni las ya reservadas. */
export function suggestAlternativeSlot(
  slots: readonly SlotAvailability[],
  fullSlotId: string,
  bookedSlotIds: readonly string[],
): SlotAvailability | null {
  const full = slots.find((s) => s.slot_id === fullSlotId);
  const ref = full ? minutes(full.start_time) : 0;
  let best: SlotAvailability | null = null;
  let bestDist = Infinity;
  for (const s of slots) {
    if (
      s.slot_id === fullSlotId ||
      s.available <= 0 ||
      bookedSlotIds.includes(s.slot_id)
    ) {
      continue;
    }
    const dist = Math.abs(minutes(s.start_time) - ref);
    if (dist < bestDist) {
      best = s;
      bestDist = dist;
    }
  }
  return best;
}

export type BookingErrorKind = "sin_cupo" | "duplicado" | "desconocido";

/** Clasifica un error de Postgres por su código. */
export function classifyBookingError(
  error: { code?: string } | null | undefined,
): BookingErrorKind {
  if (error?.code === "P0001") return "sin_cupo";
  if (error?.code === "23505") return "duplicado";
  return "desconocido";
}

export function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function bookingErrorMessage(
  kind: BookingErrorKind,
  suggestion?: Pick<
    SlotAvailability,
    "start_time" | "end_time" | "dock"
  > | null,
): string {
  if (kind === "sin_cupo") {
    const base = "La franja ya no tiene cupos disponibles.";
    return suggestion
      ? `${base} Prueba con la franja ${formatTime(suggestion.start_time)} - ${formatTime(suggestion.end_time)} (andén ${suggestion.dock}).`
      : `${base} No quedan otras franjas con cupo ese día.`;
  }
  if (kind === "duplicado") {
    return "Ya tienes un turno en esa franja.";
  }
  return "No se pudo reservar el turno. Inténtalo de nuevo.";
}
