import type { UserRole } from "@/lib/types";

export type NavLink = {
  href: string;
  label: string;
};

const INICIO: NavLink = { href: "/", label: "Inicio" };
const PANEL: NavLink = { href: "/panel", label: "Mi panel" };

/** Enlaces de navegación según el rol; null representa a un visitante sin sesión. */
export function getNavLinks(role: UserRole | null): NavLink[] {
  switch (role) {
    case "admin":
      return [INICIO, PANEL, { href: "/admin", label: "Administración" }];
    case "comerciante":
      return [INICIO, PANEL];
    case "transportista":
      return [INICIO, PANEL, { href: "/turnos", label: "Turnos" }];
    default:
      return [
        INICIO,
        { href: "/login", label: "Ingresar" },
        { href: "/registro", label: "Registrarse" },
      ];
  }
}