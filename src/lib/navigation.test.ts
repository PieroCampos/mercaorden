import { describe, expect, it } from "vitest";
import { getNavLinks } from "@/lib/navigation";

const hrefs = (role: Parameters<typeof getNavLinks>[0]) =>
  getNavLinks(role).map((link) => link.href);

describe("getNavLinks", () => {
  it("muestra acceso y registro al visitante", () => {
    expect(hrefs(null)).toEqual(["/", "/login", "/registro"]);
  });

  it("muestra turnos solo al transportista", () => {
    expect(hrefs("transportista")).toEqual(["/", "/panel", "/turnos"]);
    expect(hrefs("comerciante")).not.toContain("/turnos");
  });

  it("muestra mi panel a los roles con sesión", () => {
    expect(hrefs("comerciante")).toEqual(["/", "/panel"]);
  });

  it("muestra administración solo al admin", () => {
    expect(hrefs("admin")).toEqual(["/", "/panel", "/admin"]);
    expect(hrefs("comerciante")).not.toContain("/admin");
  });
});