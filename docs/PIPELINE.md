# Pipeline de integración y despliegue

Dos flujos en `.github/workflows/`: `ci.yml` (PR a `main` y push a `test`) y `deploy.yml` (push a `main`).

## Jobs y controles

| Job | Qué hace | Control de seguridad |
|---|---|---|
| Lint | `pnpm lint` | Calidad estática |
| Typecheck | `pnpm typecheck` | Tipado estricto |
| Pruebas (Vitest) | `pnpm test` con reporter verbose | Pruebas automáticas |
| Build | `pnpm build` con variables de relleno | Verifica que compila |
| Dependencias | dependency-review (solo PR) y `pnpm audit --audit-level=high`; las moderadas se listan sin fallar | SCA: dependencias vulnerables |
| CodeQL SAST | Análisis estático de JavaScript/TypeScript | SAST |
| Secretos (gitleaks) | Escanea el historial completo | Detección de secretos |
| Build y pruebas (deploy) | Pruebas y build en `main` | Puerta previa al despliegue |
| Deploy a Vercel | `vercel pull`, `build --prod`, `deploy --prebuilt --prod` | Secretos solo vía GitHub Secrets |
| Sincronizar test | `git push origin main:test` (sin force) | Permiso `contents: write` solo en este job |

## Secretos de despliegue

En GitHub: Settings > Secrets and variables > Actions > New repository secret. Crear:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Si falta alguno, el job de Vercel muestra un aviso y omite el despliegue sin fallar. Nunca se imprimen sus valores.

## Notas

- El auto-deploy por Git de Vercel sigue activo. Para evitar un doble despliegue, desactivarlo después: Vercel > Project > Settings > Git, o `git.deploymentEnabled` en `vercel.json`.
- El push a `test` hecho con `GITHUB_TOKEN` no dispara `ci.yml` (limitación de GitHub para evitar bucles).
- Conviene marcar los checks de `ci.yml` como requeridos en el ruleset de `main`.
