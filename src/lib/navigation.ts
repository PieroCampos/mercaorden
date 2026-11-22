import type { UserRole } from "@/lib/types";

export type NavLink = {
  href: string;
  label: string;
};

const INICIO: NavLink = { href: "/", label: "Inicio" };

/** Enlaces de navegación según el rol; null representa a un visitante sin sesión. */
export function getNavLinks(role: UserRole | null): NavLink[] {
  switch (role) {
    case "admin":
      return [INICIO, { href: "/admin", label: "Administración" }];
    case "comerciante":
    case "transportista":
      return [INICIO, { href: "/turnos", label: "Turnos" }];
    default:
      return [
        INICIO,
        { href: "/login", label: "Ingresar" },
        { href: "/registro", label: "Registrarse" },
      ];
  }
}
