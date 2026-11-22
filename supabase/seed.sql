-- MO-28: datos de ejemplo de MercaOrden.
-- Ejecutar en el SQL Editor de Supabase después de aplicar las migraciones.
-- Los usuarios de ejemplo no tienen contraseña: no pueden iniciar sesión.
-- Se puede ejecutar más de una vez sin duplicar datos.

begin;

-- Usuarios de ejemplo. El trigger on_auth_user_created crea cada perfil.
insert into auth.users (
  instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'role', u.app_role,
    'full_name', u.full_name,
    'doc_number', u.doc_number,
    'business_name', u.business_name,
    'business_type', u.business_type
  ),
  now(), now(), '', '', '', ''
from (
  values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'comerciante.pendiente1@example.test', 'comerciante', 'Rosa Quispe Mamani', '10000001', 'Verduras Doña Rosa', 'Verduras'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'comerciante.pendiente2@example.test', 'comerciante', 'Julio Flores Rojas', '20100000011', 'Frutas del Valle SAC', 'Frutas'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'comerciante.aprobado@example.test', 'comerciante', 'Carmen Huamán Díaz', '10000003', 'Tubérculos Carmen', 'Tubérculos'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'comerciante.rechazado@example.test', 'comerciante', 'Luis Vargas Soto', '10000004', 'Abarrotes Vargas', 'Abarrotes'),
    ('00000000-0000-4000-8000-000000000011'::uuid, 'transportista1@example.test', 'transportista', 'Pedro Condori Apaza', '10000011', 'Transportes Condori', 'Transporte de carga'),
    ('00000000-0000-4000-8000-000000000012'::uuid, 'transportista2@example.test', 'transportista', 'Ana Torres Lima', '10000012', 'Carga Rápida Torres', 'Transporte de carga'),
    ('00000000-0000-4000-8000-000000000013'::uuid, 'transportista3@example.test', 'transportista', 'Mario Salas Ccori', '10000013', 'Fletes Salas', 'Transporte de carga')
) as u(id, email, app_role, full_name, doc_number, business_name, business_type)
on conflict (id) do nothing;

-- Estados de los comerciantes de ejemplo.
update public.profiles
set status = 'aprobado', rejection_reason = null
where id = '00000000-0000-4000-8000-000000000003';

update public.profiles
set status = 'rechazado', rejection_reason = 'Documento de identidad ilegible'
where id = '00000000-0000-4000-8000-000000000004';

-- Franjas de los próximos 7 días (hora Lima): 4 horarios y 2 andenes.
-- La franja de las 06:00 del andén 1 tiene capacidad 2 para mostrar una franja llena.
insert into public.time_slots (slot_date, start_time, end_time, dock, capacity)
select
  d::date,
  h.start_time,
  h.end_time,
  a.dock,
  case when h.start_time = time '06:00' and a.dock = 1 then 2 else 4 end
from generate_series(
  (now() at time zone 'America/Lima')::date,
  (now() at time zone 'America/Lima')::date + 6,
  interval '1 day'
) as d
cross join (
  values
    (time '06:00', time '07:00'),
    (time '07:00', time '08:00'),
    (time '08:00', time '09:00'),
    (time '09:00', time '10:00')
) as h(start_time, end_time)
cross join (values (1), (2)) as a(dock)
on conflict (slot_date, start_time, dock) do nothing;

-- Turnos de ejemplo. Se filtra antes de insertar porque el trigger de cupo
-- se ejecuta antes de la comprobación de unicidad.
insert into public.bookings (slot_id, profile_id, plate, status)
select s.id, b.profile_id, b.plate, b.status::public.booking_status
from (
  values
    (0, time '06:00', 1, '00000000-0000-4000-8000-000000000011'::uuid, 'ABC-123', 'confirmado'),
    (0, time '06:00', 1, '00000000-0000-4000-8000-000000000012'::uuid, 'D4E-567', 'confirmado'),
    (0, time '07:00', 2, '00000000-0000-4000-8000-000000000011'::uuid, 'ABC-123', 'confirmado'),
    (0, time '08:00', 1, '00000000-0000-4000-8000-000000000013'::uuid, 'F7G-890', 'cancelado'),
    (1, time '08:00', 1, '00000000-0000-4000-8000-000000000013'::uuid, 'F7G-890', 'confirmado'),
    (2, time '09:00', 2, '00000000-0000-4000-8000-000000000012'::uuid, 'D4E-567', 'confirmado')
) as b(day_offset, start_time, dock, profile_id, plate, status)
join public.time_slots s
  on s.slot_date = (now() at time zone 'America/Lima')::date + b.day_offset
  and s.start_time = b.start_time
  and s.dock = b.dock
where not exists (
  select 1 from public.bookings e
  where e.slot_id = s.id and e.profile_id = b.profile_id
);

commit;
