-- MO-25: esquema base de MercaOrden (perfiles, franjas de ingreso y reservas).

-- Tipos
create type public.user_role as enum ('comerciante', 'transportista', 'admin');
create type public.approval_status as enum ('pendiente', 'aprobado', 'rechazado');
create type public.booking_status as enum ('confirmado', 'cancelado');

-- Tablas
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'comerciante',
  full_name text,
  doc_number text,
  business_name text,
  business_type text,
  status public.approval_status not null default 'pendiente',
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table public.time_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  dock int not null check (dock > 0),
  capacity int not null check (capacity > 0),
  check (end_time > start_time),
  unique (slot_date, start_time, dock)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.time_slots (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  plate text not null check (length(trim(plate)) > 0),
  status public.booking_status not null default 'confirmado',
  created_at timestamptz not null default now(),
  unique (slot_id, profile_id)
);

create index bookings_profile_id_idx on public.bookings (profile_id);
create index time_slots_slot_date_idx on public.time_slots (slot_date);

-- Funciones auxiliares de autorización.
-- security definer evita la recursión de RLS al consultar profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create function public.is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and status = 'aprobado'
      and role in ('comerciante', 'transportista')
  );
$$;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_approved() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved() to authenticated;

-- Crea el perfil al registrarse. El rol admin nunca se acepta desde los metadatos.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  assigned_role public.user_role;
begin
  if requested_role = 'transportista' then
    assigned_role := 'transportista';
  else
    assigned_role := 'comerciante';
  end if;

  insert into public.profiles (
    id, role, full_name, doc_number, business_name, business_type, status
  )
  values (
    new.id,
    assigned_role,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'doc_number',
    new.raw_user_meta_data ->> 'business_name',
    new.raw_user_meta_data ->> 'business_type',
    case
      when assigned_role = 'transportista' then 'aprobado'::public.approval_status
      else 'pendiente'::public.approval_status
    end
  );

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Limita qué columnas puede cambiar cada rol desde la API.
-- Las sesiones administrativas (SQL Editor, service_role) quedan exentas.
create function public.protect_profile_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.role is distinct from old.role
    or new.created_at is distinct from old.created_at then
    raise exception 'No se puede modificar id, role ni created_at'
      using errcode = '42501';
  end if;

  if public.is_admin() then
    if new.full_name is distinct from old.full_name
      or new.doc_number is distinct from old.doc_number
      or new.business_name is distinct from old.business_name
      or new.business_type is distinct from old.business_type then
      raise exception 'El administrador solo puede cambiar status y rejection_reason'
        using errcode = '42501';
    end if;
  elsif new.status is distinct from old.status
    or new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'No se puede modificar status ni rejection_reason'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger profiles_protect_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Mantiene la capacidad de la franja y la inmutabilidad de la reserva.
-- security definer permite contar las reservas de todos los usuarios pese a RLS.
create function public.enforce_booking_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  slot_capacity int;
  confirmed_count int;
begin
  if tg_op = 'UPDATE'
    and (new.slot_id is distinct from old.slot_id
      or new.profile_id is distinct from old.profile_id
      or new.created_at is distinct from old.created_at) then
    raise exception 'No se puede modificar slot_id, profile_id ni created_at'
      using errcode = '42501';
  end if;

  if new.status <> 'confirmado'
    or (tg_op = 'UPDATE' and old.status = 'confirmado') then
    return new;
  end if;

  -- El bloqueo serializa las reservas simultáneas de una misma franja.
  select capacity into slot_capacity
  from public.time_slots
  where id = new.slot_id
  for update;

  if slot_capacity is null then
    raise exception 'La franja no existe' using errcode = '23503';
  end if;

  select count(*) into confirmed_count
  from public.bookings
  where slot_id = new.slot_id
    and status = 'confirmado'
    and id <> new.id;

  if confirmed_count >= slot_capacity then
    raise exception 'La franja no tiene cupos disponibles' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_booking_rules() from public, anon, authenticated;

create trigger bookings_enforce_rules
  before insert or update on public.bookings
  for each row execute function public.enforce_booking_rules();

-- RLS
alter table public.profiles enable row level security;
alter table public.time_slots enable row level security;
alter table public.bookings enable row level security;

-- profiles: sin políticas INSERT ni DELETE; el perfil solo lo crea el trigger.
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles_update_admin"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- time_slots: solo lectura desde la API.
create policy "time_slots_select_authenticated"
  on public.time_slots for select to authenticated
  using (true);

-- bookings
create policy "bookings_select_own_or_admin"
  on public.bookings for select to authenticated
  using (profile_id = (select auth.uid()) or (select public.is_admin()));

create policy "bookings_insert_own_approved"
  on public.bookings for insert to authenticated
  with check (
    profile_id = (select auth.uid())
    and status = 'confirmado'
    and (select public.is_approved())
  );

create policy "bookings_update_own_approved"
  on public.bookings for update to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and (status = 'cancelado' or (select public.is_approved()))
  );

-- Disponibilidad por franja: expone solo totales, nunca datos de otras reservas.
create function public.get_slot_availability(p_slot_date date)
returns table (
  slot_id uuid,
  slot_date date,
  start_time time,
  end_time time,
  dock int,
  capacity int,
  booked int,
  available int
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.slot_date,
    s.start_time,
    s.end_time,
    s.dock,
    s.capacity,
    count(b.id)::int,
    greatest(s.capacity - count(b.id)::int, 0)
  from public.time_slots s
  left join public.bookings b
    on b.slot_id = s.id and b.status = 'confirmado'
  where s.slot_date = p_slot_date
  group by s.id
  order by s.start_time, s.dock;
$$;

revoke execute on function public.get_slot_availability(date) from public, anon;
grant execute on function public.get_slot_availability(date) to authenticated;

-- Privilegios mínimos por tabla.
revoke all on public.profiles, public.time_slots, public.bookings from anon;
revoke all on public.profiles, public.time_slots, public.bookings from authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.time_slots to authenticated;
grant select, insert, update on public.bookings to authenticated;
