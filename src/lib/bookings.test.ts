import { describe, expect, it } from "vitest";
import {
  bookingErrorMessage,
  canBook,
  classifyBookingError,
  isBookableDate,
  isUuid,
  isValidDateString,
  normalizePlate,
  resolveDate,
  suggestAlternativeSlot,
  todayInLima,
} from "@/lib/bookings";
import type { SlotAvailability } from "@/lib/types";

const slot = (
  id: string,
  start: string,
  available: number,
): SlotAvailability => ({
  slot_id: id,
  slot_date: "2026-12-01",
  start_time: start,
  end_time: "23:59:00",
  dock: 1,
  capacity: 2,
  booked: 2 - available,
  available,
});

describe("placa", () => {
  it("normaliza con o sin guion y minúsculas", () => {
    expect(normalizePlate("abc123")).toBe("ABC-123");
    expect(normalizePlate(" a1b-234 ")).toBe("A1B-234");
  });
  it("rechaza formatos inválidos", () => {
    expect(normalizePlate("AB-123")).toBeNull();
    expect(normalizePlate("ABCD123")).toBeNull();
    expect(normalizePlate("ABC-12A")).toBeNull();
    expect(normalizePlate(null)).toBeNull();
  });
});

describe("fechas", () => {
  const now = new Date("2026-12-01T03:00:00Z"); // 30-nov 22:00 en Lima
  it("calcula hoy en Lima", () => {
    expect(todayInLima(now)).toBe("2026-11-30");
  });
  it("valida fechas reales", () => {
    expect(isValidDateString("2026-02-30")).toBe(false);
    expect(isValidDateString("2026-12-01")).toBe(true);
    expect(isValidDateString("01/12/2026")).toBe(false);
  });
  it("rechaza fechas pasadas", () => {
    expect(isBookableDate("2026-11-29", now)).toBe(false);
    expect(isBookableDate("2026-11-30", now)).toBe(true);
  });
  it("vuelve a hoy si es inválida", () => {
    expect(resolveDate("basura", now)).toBe("2026-11-30");
    expect(resolveDate("2026-12-05", now)).toBe("2026-12-05");
  });
  it("valida uuid", () => {
    expect(isUuid("3f2b8c1e-1a2b-4c3d-8e9f-0123456789ab")).toBe(true);
    expect(isUuid("x")).toBe(false);
  });
});

describe("canBook", () => {
  it("permite con cupo", () => {
    expect(canBook(slot("a", "08:00", 1), [])).toEqual({ ok: true });
  });
  it("rechaza sin cupo y duplicado", () => {
    expect(canBook(slot("a", "08:00", 0), [])).toEqual({
      ok: false,
      reason: "sin_cupo",
    });
    expect(canBook(slot("a", "08:00", 1), ["a"])).toEqual({
      ok: false,
      reason: "duplicado",
    });
  });
});

describe("suggestAlternativeSlot", () => {
  const slots = [
    slot("a", "08:00", 0),
    slot("b", "09:00", 1),
    slot("c", "10:00", 2),
    slot("d", "07:30", 1),
  ];
  it("elige la más cercana con cupo", () => {
    expect(suggestAlternativeSlot(slots, "a", [])?.slot_id).toBe("d");
  });
  it("excluye las ya reservadas", () => {
    expect(suggestAlternativeSlot(slots, "a", ["d"])?.slot_id).toBe("b");
  });
  it("devuelve null si no hay", () => {
    expect(suggestAlternativeSlot([slot("a", "08:00", 0)], "a", [])).toBeNull();
  });
});

describe("errores", () => {
  it("clasifica códigos", () => {
    expect(classifyBookingError({ code: "P0001" })).toBe("sin_cupo");
    expect(classifyBookingError({ code: "23505" })).toBe("duplicado");
    expect(classifyBookingError({ code: "x" })).toBe("desconocido");
    expect(classifyBookingError(null)).toBe("desconocido");
  });
  it("incluye la sugerencia", () => {
    const msg = bookingErrorMessage("sin_cupo", slot("b", "09:00:00", 1));
    expect(msg).toContain("09:00");
  });
});
