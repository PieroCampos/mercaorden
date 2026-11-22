import { describe, expect, it } from "vitest";
import { getNavLinks } from "@/lib/navigation";

const hrefs = (role: Parameters<typeof getNavLinks>[0]) =>
  getNavLinks(role).map((link) => link.href);

describe("getNavLinks", () => {
  it("muestra acceso y registro al visitante", () => {
    expect(hrefs(null)).toEqual(["/", "/login", "/registro"]);
  });

  it("muestra turnos a comerciante y transportista", () => {
    expect(hrefs("comerciante")).toEqual(["/", "/turnos"]);
    expect(hrefs("transportista")).toEqual(["/", "/turnos"]);
  });

  it("muestra administración solo al admin", () => {
    expect(hrefs("admin")).toEqual(["/", "/admin"]);
    expect(hrefs("comerciante")).not.toContain("/admin");
  });
});
