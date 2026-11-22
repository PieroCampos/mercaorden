import { describe, expect, it } from "vitest";
import { groupSlots, validateRejectionReason } from "@/lib/admin";
import {
  bookingErrorMessage,
  canBook,
  classifyBookingError,
  isBookableDate,
  normalizePlate,
  suggestAlternativeSlot,
} from "@/lib/bookings";
import { getNavLinks } from "@/lib/navigation";
import type { SlotAvailability } from "@/lib/types";
import { registroSchema } from "@/lib/validation";

function franja(
  slot_id: string,
  start_time: string,
  available: number,
  dock = 1,
): SlotAvailability {
  return {
    slot_id,
    slot_date: "2026-12-01",
    start_time,
    end_time: "23:00:00",
    dock,
    capacity: 4,
    booked: 4 - available,
    available,
  };
}

const registroValido = {
  role: "comerciante",
  full_name: "Rosa Quispe",
  doc_number: "12345678",
  business_name: "Verduras Rosa",
  business_type: "Verduras",
  email: "rosa@example.test",
  password: "clave-de-prueba",
};

describe("regla de cupo", () => {
  it("permite reservar con al menos un cupo", () => {
    expect(canBook({ slot_id: "a", available: 1 }, [])).toEqual({ ok: true });
  });

  it("rechaza una franja sin cupos", () => {
    expect(canBook({ slot_id: "a", available: 0 }, [])).toEqual({
      ok: false,
      reason: "sin_cupo",
    });
  });

  it("sugiere la franja con cupo más cercana en hora", () => {
    const franjas = [
      franja("llena", "08:00:00", 0),
      franja("lejana", "06:00:00", 2),
      franja("cercana", "09:00:00", 1),
    ];
    expect(suggestAlternativeSlot(franjas, "llena", [])?.slot_id).toBe("cercana");
  });

  it("no sugiere franjas llenas ni ya reservadas", () => {
    const franjas = [
      franja("llena", "08:00:00", 0),
      franja("otra-llena", "09:00:00", 0),
      franja("mia", "10:00:00", 3),
    ];
    expect(suggestAlternativeSlot(franjas, "llena", ["mia"])).toBeNull();
  });

  it("traduce el error de capacidad del trigger", () => {
    const tipo = classifyBookingError({ code: "P0001" });
    expect(tipo).toBe("sin_cupo");
    expect(bookingErrorMessage(tipo, null)).toContain("no tiene cupos");
  });
});

describe("regla de duplicados", () => {
  it("rechaza una segunda reserva en la misma franja", () => {
    expect(canBook({ slot_id: "a", available: 3 }, ["a"])).toEqual({
      ok: false,
      reason: "duplicado",
    });
  });

  it("da prioridad al duplicado cuando además no hay cupo", () => {
    expect(canBook({ slot_id: "a", available: 0 }, ["a"])).toEqual({
      ok: false,
      reason: "duplicado",
    });
  });

  it("permite reservar otra franja", () => {
    expect(canBook({ slot_id: "b", available: 1 }, ["a"])).toEqual({ ok: true });
  });

  it("traduce la violación de unicidad", () => {
    expect(classifyBookingError({ code: "23505" })).toBe("duplicado");
  });
});

describe("datos de la reserva", () => {
  it.each([
    ["abc123", "ABC-123"],
    ["ABC-123", "ABC-123"],
    ["a1b-234", "A1B-234"],
  ])("normaliza la placa %s", (entrada, esperado) => {
    expect(normalizePlate(entrada)).toBe(esperado);
  });

  it.each(["", "AB-12", "ABCD-1234", "123-456", "ABC-12A"])(
    "rechaza la placa %s",
    (entrada) => {
      expect(normalizePlate(entrada)).toBeNull();
    },
  );

  it("no permite fechas pasadas según la hora de Lima", () => {
    const ahora = new Date("2026-12-02T04:30:00Z");
    expect(isBookableDate("2026-11-30", ahora)).toBe(false);
    expect(isBookableDate("2026-12-01", ahora)).toBe(true);
  });
});

describe("regla de roles", () => {
  it.each(["comerciante", "transportista"])("permite registrarse como %s", (role) => {
    expect(registroSchema.safeParse({ ...registroValido, role }).success).toBe(true);
  });

  it("nunca permite elegir el rol admin", () => {
    expect(registroSchema.safeParse({ ...registroValido, role: "admin" }).success).toBe(false);
  });

  it("muestra Turnos solo al transportista", () => {
    const tieneTurnos = (role: "comerciante" | "transportista" | "admin" | null) =>
      getNavLinks(role).some((l) => l.href === "/turnos");
    expect(tieneTurnos("transportista")).toBe(true);
    expect(tieneTurnos("comerciante")).toBe(false);
    expect(tieneTurnos("admin")).toBe(false);
    expect(tieneTurnos(null)).toBe(false);
  });

  it("muestra Administración solo al admin", () => {
    const tieneAdmin = (role: "comerciante" | "transportista" | "admin" | null) =>
      getNavLinks(role).some((l) => l.href === "/admin");
    expect(tieneAdmin("admin")).toBe(true);
    expect(tieneAdmin("comerciante")).toBe(false);
    expect(tieneAdmin("transportista")).toBe(false);
    expect(tieneAdmin(null)).toBe(false);
  });
});

describe("regla de aprobación", () => {
  it("exige motivo para rechazar", () => {
    expect(validateRejectionReason("   ").ok).toBe(false);
    expect(validateRejectionReason(null).ok).toBe(false);
  });

  it("recorta el motivo válido", () => {
    expect(validateRejectionReason("  Documento ilegible  ")).toEqual({
      ok: true,
      value: "Documento ilegible",
    });
  });

  it("rechaza un motivo demasiado largo", () => {
    expect(validateRejectionReason("x".repeat(501)).ok).toBe(false);
  });

  it("cuenta solo los turnos confirmados del día", () => {
    const [grupo] = groupSlots([
      {
        id: "s1",
        start_time: "06:00:00",
        end_time: "07:00:00",
        dock: 1,
        capacity: 2,
        bookings: [
          { id: "b1", plate: "ABC-123", status: "confirmado", profiles: { full_name: "Ana" } },
          { id: "b2", plate: "D4E-567", status: "cancelado", profiles: { full_name: "Luis" } },
        ],
      },
    ]);
    expect(grupo.occupied).toBe(1);
    expect(grupo.bookings.map((b) => b.plate)).toEqual(["ABC-123"]);
  });
});
