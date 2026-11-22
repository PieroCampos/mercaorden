# Guía de desarrollo

## Comandos

| Comando | Uso |
| --- | --- |
| `pnpm install` | Instala dependencias |
| `pnpm dev` | Servidor de desarrollo en http://localhost:3000 |
| `pnpm build` | Build de producción (no requiere `.env.local`) |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Verificación de tipos |
| `pnpm test` | Pruebas con Vitest (`src/**/*.test.ts(x)`) |

Antes de abrir un PR deben pasar `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.

## Estructura

```text
src/
  proxy.ts               Refresco de sesión en cada petición
  app/                   Rutas (App Router)
  components/            Componentes propios
  components/ui/         Componentes shadcn/ui
  lib/auth.ts            getCurrentProfile y requireRole
  lib/navigation.ts      Enlaces por rol
  lib/types.ts           Tipos de las tablas
  lib/supabase/          Clientes de navegador, servidor y proxy
supabase/migrations/     Migraciones SQL
docs/                    Documentación técnica
```

Next.js 16 usa `src/proxy.ts` en lugar de `middleware.ts`. No crear un `middleware.ts`.

## Componentes shadcn/ui

```bash
pnpm dlx shadcn@4.23.0 add <componente>
```

El estilo instalado (`base-nova`) usa Base UI: no existe la prop `asChild`. Para un enlace con aspecto de botón usa `className={buttonVariants()}` sobre `Link`.

## Ramas y commits

- `main`: producción. Solo recibe cambios por Pull Request con merge commit.
- `test`: copia de `main` para pruebas.
- Ramas de trabajo: `MO-n-slug`, por ejemplo `MO-10-reservar-turno`.
- Commits: `MO-n: mensaje descriptivo`.
- Título del PR: `MO-n: descripción`. El cuerpo indica historia, criterios cubiertos y cómo probar.
- Si hay conflictos: `git fetch`, `git merge origin/main`, resolver, probar y subir.

## Reglas de trabajo

- Cada carpeta o worktree necesita su propio `.env.local`, que no se sube a git.
- El repositorio es público: nunca incluir claves, tokens ni URLs con claves.
- No modificar `0001_init.sql` ni archivos de otras historias. Un cambio de esquema se acuerda antes y va en una migración nueva.
- Interfaz y documentación en español.
- Usar valores de relleno para pruebas o CI, nunca claves reales.
