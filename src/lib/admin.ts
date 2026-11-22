export const MOTIVO_MIN = 5;
export const MOTIVO_MAX = 500;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export type ReasonResult = { ok: true; value: string } | { ok: false; error: string };

/** Valida el motivo de rechazo: obligatorio, recortado, entre 5 y 500 caracteres. */
export function validateRejectionReason(input: unknown): ReasonResult {
  const value = typeof input === "string" ? input.trim() : "";
  if (value.length === 0) {
    return { ok: false, error: "El motivo del rechazo es obligatorio." };
  }
  if (value.length < MOTIVO_MIN) {
    return { ok: false, error: `El motivo debe tener al menos ${MOTIVO_MIN} caracteres.` };
  }
  if (value.length > MOTIVO_MAX) {
    return { ok: false, error: `El motivo no puede superar los ${MOTIVO_MAX} caracteres.` };
  }
  return { ok: true, value };
}

/** Fecha (YYYY-MM-DD) en la zona America/Lima, independiente de la zona del servidor. */
export function getLimaDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

type ProfileRef = { full_name: string | null } | { full_name: string | null }[] | null;

export type RawBooking = {
  id: string;
  plate: string;
  status: string;
  profiles?: ProfileRef;
};

export type RawSlot = {
  id: string;
  start_time: string;
  end_time: string;
  dock: number;
  capacity: number;
  bookings?: RawBooking[] | null;
};

export type SlotGroup = {
  id: string;
  start: string;
  end: string;
  dock: number;
  capacity: number;
  occupied: number;
  bookings: { id: string; plate: string; carrier: string }[];
};

function hhmm(time: string): string {
  return time.slice(0, 5);
}

/** Agrupa franjas con sus reservas confirmadas, ordenadas por hora y andén. */
export function groupSlots(slots: RawSlot[]): SlotGroup[] {
  return slots
    .map((slot) => {
      const bookings = (slot.bookings ?? [])
        .filter((b) => b.status === "confirmado")
        .map((b) => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          return {
            id: b.id,
            plate: b.plate,
            carrier: profile?.full_name?.trim() || "Sin nombre",
          };
        });
      return {
        id: slot.id,
        start: hhmm(slot.start_time),
        end: hhmm(slot.end_time),
        dock: slot.dock,
        capacity: slot.capacity,
        occupied: bookings.length,
        bookings,
      };
    })
    .sort((a, b) => a.start.localeCompare(b.start) || a.dock - b.dock);
}
