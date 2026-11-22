import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("prueba de humo", () => {
  it("ejecuta Vitest y resuelve el alias @", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
