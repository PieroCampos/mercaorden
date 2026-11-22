import { describe, expect, it } from "vitest";
import {
  getLimaDate,
  groupSlots,
  isUuid,
  validateRejectionReason,
  type RawSlot,
} from "./admin";

describe("validateRejectionReason", () => {
  it("rechaza vacío y solo espacios", () => {
    expect(validateRejectionReason("").ok).toBe(false);
    expect(validateRejectionReason("     ").ok).toBe(false);
    expect(validateRejectionReason(undefined).ok).toBe(false);
  });
  it("exige al menos 5 caracteres tras recortar", () => {
    expect(validateRejectionReason(" abcd ").ok).toBe(false);
    expect(validateRejectionReason(" abcde ")).toEqual({ ok: true, value: "abcde" });
  });
  it("acepta hasta 500 y rechaza 501", () => {
    expect(validateRejectionReason("a".repeat(500)).ok).toBe(true);
    expect(validateRejectionReason("a".repeat(501)).ok).toBe(false);
  });
});

describe("isUuid", () => {
  it("valida formato", () => {
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isUuid("no-es-uuid")).toBe(false);
    expect(isUuid(null)).toBe(false);
  });
});

describe("getLimaDate", () => {
  it("usa la fecha de Lima, no la de UTC", () => {
    // 2026-11-22 03:30 UTC = 2026-11-21 22:30 en Lima
    expect(getLimaDate(new Date("2026-11-22T03:30:00Z"))).toBe("2026-11-21");
  });
  it("cambia de día a medianoche de Lima (05:00 UTC)", () => {
    expect(getLimaDate(new Date("2026-11-22T04:59:59Z"))).toBe("2026-11-21");
    expect(getLimaDate(new Date("2026-11-22T05:00:00Z"))).toBe("2026-11-22");
  });
  it("cambia de año correctamente", () => {
    expect(getLimaDate(new Date("2027-01-01T04:59:00Z"))).toBe("2026-12-31");
  });
});

describe("groupSlots", () => {
  const slots: RawSlot[] = [
    {
      id: "b",
      start_time: "09:00:00",
      end_time: "10:00:00",
      dock: 1,
      capacity: 2,
      bookings: [],
    },
    {
      id: "a",
      start_time: "06:00:00",
      end_time: "07:00:00",
      dock: 2,
      capacity: 3,
      bookings: [
        { id: "1", plate: "ABC-123", status: "confirmado", profiles: { full_name: "Ana" } },
        { id: "2", plate: "XYZ-999", status: "cancelado", profiles: { full_name: "Luis" } },
        { id: "3", plate: "QQQ-111", status: "confirmado", profiles: [{ full_name: null }] },
      ],
    },
  ];
  it("ordena, cuenta solo confirmadas y nombra al transportista", () => {
    const r = groupSlots(slots);
    expect(r.map((s) => s.id)).toEqual(["a", "b"]);
    expect(r[0].start).toBe("06:00");
    expect(r[0].occupied).toBe(2);
    expect(r[0].bookings.map((b) => b.carrier)).toEqual(["Ana", "Sin nombre"]);
    expect(r[1].occupied).toBe(0);
  });
  it("devuelve lista vacía sin franjas", () => {
    expect(groupSlots([])).toEqual([]);
  });
});
