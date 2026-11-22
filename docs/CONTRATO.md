# Contrato técnico

Referencia compartida por las historias MO-2, MO-10 y MO-22. La fuente de verdad del esquema es `supabase/migrations/0001_init.sql`.

## Roles y estados

| Enum | Valores |
| --- | --- |
| `user_role` | `comerciante`, `transportista`, `admin` |
| `approval_status` | `pendiente`, `aprobado`, `rechazado` |
| `booking_status` | `confirmado`, `cancelado` |

- Comerciante: inicia `pendiente` y requiere aprobación del admin.
- Transportista: inicia `aprobado`.
- Admin: solo se asigna por SQL desde el panel de Supabase.

## Tablas

### `profiles`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid PK | Referencia `auth.users`, borrado en cascada |
| `role` | `user_role` | No editable desde la API |
| `full_name` | text | Editable por el dueño |
| `doc_number` | text | Editable por el dueño |
| `business_name` | text | Editable por el dueño |
| `business_type` | text | Editable por el dueño |
| `status` | `approval_status` | Solo admin |
| `rejection_reason` | text | Solo admin |
| `created_at` | timestamptz | No editable |

### `time_slots`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid PK | |
| `slot_date` | date | |
| `start_time` | time | |
| `end_time` | time | Mayor que `start_time` |
| `dock` | int | Mayor que 0 |
| `capacity` | int | Mayor que 0 |

Único por `(slot_date, start_time, dock)`. Las franjas se crean por SQL; la API no las modifica.

### `bookings`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid PK | |
| `slot_id` | uuid FK | `time_slots`, inmutable |
| `profile_id` | uuid FK | `profiles`, inmutable |
| `plate` | text | Obligatoria |
| `status` | `booking_status` | Por defecto `confirmado` |
| `created_at` | timestamptz | Inmutable |

Único por `(slot_id, profile_id)`.

## Permisos (RLS)

| Tabla | Usuario autenticado | Admin |
| --- | --- | --- |
| `profiles` | Lee y edita su fila, solo datos personales | Lee todo; cambia solo `status` y `rejection_reason` |
| `time_slots` | Lee | Lee |
| `bookings` | Lee las suyas; crea y actualiza si está `aprobado`; puede cancelar | Lee todo |

Nadie crea ni borra perfiles desde la API. Tampoco se borran reservas: se cancelan.

## Registro (MO-2)

El trigger `on_auth_user_created` crea el perfil. Enviar los datos en `options.data` de `supabase.auth.signUp`:

```ts
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: "comerciante", // o "transportista"
      full_name,
      doc_number,
      business_name,
      business_type,
    },
  },
});
```

Cualquier rol distinto de `transportista`, incluido `admin`, se registra como `comerciante`. No insertar en `profiles` desde la aplicación.

## Reservas (MO-10)

- Solo reservan perfiles `comerciante` o `transportista` con `status = 'aprobado'`.
- El trigger `bookings_enforce_rules` impide superar `capacity`, incluso con reservas simultáneas. Error: `La franja no tiene cupos disponibles` (código `P0001`).
- Duplicado de franja y usuario: código `23505`.
- **Volver a reservar tras cancelar:** por la restricción única, actualizar la fila existente a `status = 'confirmado'` (y `plate` si cambió). No insertar otra.
- Un usuario no puede contar las reservas ajenas por RLS. Para mostrar cupos, MO-10 debe acordar antes una migración nueva con una función o vista de disponibilidad.

## Administración (MO-22)

- Aprobar: `update profiles set status = 'aprobado', rejection_reason = null`.
- Rechazar: `update profiles set status = 'rechazado', rejection_reason = <motivo>`.
- Turnos del día: leer `time_slots` por `slot_date` y sus `bookings`.

## Rutas previstas

| Ruta | Acceso | Historia |
| --- | --- | --- |
| `/` | Público | MO-25 |
| `/registro` | Público | MO-2 |
| `/login` | Público | MO-2 |
| `/turnos` | `comerciante`, `transportista` | MO-10 |
| `/admin` | `admin` | MO-22 |

Las rutas protegidas llaman a `requireRole` en el servidor. El cierre de sesión corresponde a MO-2.

## Helpers

| Helper | Archivo | Comportamiento |
| --- | --- | --- |
| `getCurrentProfile()` | `src/lib/auth.ts` | `Promise<Profile \| null>`, cacheado por petición |
| `requireRole(roles)` | `src/lib/auth.ts` | Devuelve `Profile`; sin sesión va a `/login`, con otro rol a `/` |
| `createClient()` | `src/lib/supabase/server.ts` | Asíncrono, para código de servidor |
| `createClient()` | `src/lib/supabase/client.ts` | Síncrono, para componentes de cliente |
| `getNavLinks(role)` | `src/lib/navigation.ts` | Enlaces por rol |

Los tipos `Profile`, `TimeSlot`, `Booking`, `UserRole`, `ApprovalStatus` y `BookingStatus` están en `src/lib/types.ts`.
