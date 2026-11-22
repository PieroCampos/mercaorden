# mercaorden

Plataforma web para ordenar el mercado mayorista de La Parada.

## Qué es MercaOrden

La Parada, en La Victoria (Lima), enfrenta problemas de salubridad, comercio sin registro, caos vehicular y estibaje informal. MercaOrden ayuda a formalizar y ordenar el mercado mediante incentivos como el turno de ingreso garantizado y las tarifas claras.

El MVP cubre:

- Registro e inicio de sesión con rol (MO-2).
- Reserva de turnos de ingreso vehicular (MO-10).
- Panel de administración para aprobar o rechazar comerciantes y ver los turnos del día (MO-22).

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS y shadcn/ui.
- Supabase: Auth, Postgres y Row Level Security.
- Vitest, ESLint y pnpm.
- Vercel y GitHub Actions.

## Cómo correrlo

Requisitos: Node.js 22 y pnpm 12.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Completa `.env.local` con los datos de tu proyecto Supabase, aplica `supabase/migrations/0001_init.sql` desde el SQL Editor y abre http://localhost:3000. Para cargar datos de ejemplo y crear un administrador, sigue la [guía de desarrollo](docs/DESARROLLO.md#datos-de-ejemplo-y-usuarios).

## Pantallas

| Ruta | Acceso | Función |
| --- | --- | --- |
| `/` | Público | Inicio |
| `/registro` | Público | Crear cuenta de comerciante o transportista |
| `/login` | Público | Iniciar sesión |
| `/panel` | Con sesión | Ver datos y estado de la cuenta |
| `/turnos` | Transportista | Reservar franja y andén |
| `/admin` | Administrador | Aprobar o rechazar comerciantes y ver los turnos del día |

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (anon) del proyecto |

`.env.local` no se sube al repositorio. `pnpm build` funciona sin estas variables, pero la autenticación y los datos las necesitan en ejecución.

## Documentación

- [Guía de desarrollo](docs/DESARROLLO.md)
- [Contrato técnico](docs/CONTRATO.md)
- [Pipeline CI/CD](docs/PIPELINE.md)
