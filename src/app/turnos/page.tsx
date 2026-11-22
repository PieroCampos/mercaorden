import { requireRole } from "@/lib/auth";
import { formatTime, resolveDate, todayInLima } from "@/lib/bookings";
import { createClient } from "@/lib/supabase/server";
import type { SlotAvailability } from "@/lib/types";
import { ReservarForm } from "./reservar-form";

export const dynamic = "force-dynamic";

type OwnBooking = {
  id: string;
  slot_id: string;
  plate: string;
  status: "confirmado" | "cancelado";
  time_slots: {
    slot_date: string;
    start_time: string;
    end_time: string;
    dock: number;
  } | null;
};

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string | string[] }>;
}) {
  const profile = await requireRole(["transportista"]);
  const params = await searchParams;
  const raw = Array.isArray(params.fecha) ? params.fecha[0] : params.fecha;
  const fecha = resolveDate(raw);

  const supabase = await createClient();
  const [{ data: slotsData, error }, { data: mineData }] = await Promise.all([
    supabase.rpc("get_slot_availability", { p_slot_date: fecha }),
    supabase
      .from("bookings")
      .select(
        "id, slot_id, plate, status, time_slots(slot_date, start_time, end_time, dock)",
      )
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  const slots = (slotsData as SlotAvailability[] | null) ?? [];
  const mine = (mineData as unknown as OwnBooking[] | null) ?? [];
  const confirmedIds = new Set(
    mine.filter((b) => b.status === "confirmado").map((b) => b.slot_id),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Reservar turno</h1>
        <p className="text-sm text-muted-foreground">
          Elige una franja horaria y un andén para tu descarga.
        </p>
      </header>

      <form method="get" className="flex items-end gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Fecha
          <input
            type="date"
            name="fecha"
            defaultValue={fecha}
            min={todayInLima()}
            className="h-8 rounded-md border bg-background px-2"
          />
        </label>
        <button
          type="submit"
          className="h-8 rounded-md border px-3 text-sm hover:bg-muted"
        >
          Ver franjas
        </button>
      </form>

      <section className="flex flex-col gap-3" aria-label="Franjas del día">
        <h2 className="text-lg font-medium">Franjas del {fecha}</h2>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            No se pudieron cargar las franjas.
          </p>
        )}
        {!error && slots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay franjas disponibles para esta fecha.
          </p>
        )}
        {slots.map((s) => {
          const mineHere = confirmedIds.has(s.slot_id);
          const full = s.available <= 0;
          return (
            <div
              key={s.slot_id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {formatTime(s.start_time)} - {formatTime(s.end_time)} · Andén{" "}
                  {s.dock}
                </p>
                <p className="text-muted-foreground">
                  {full
                    ? "Sin cupos"
                    : `${s.available} de ${s.capacity} cupos disponibles`}
                </p>
                {mineHere && (
                  <p className="text-green-700">Ya tienes un turno aquí</p>
                )}
              </div>
              <ReservarForm
                slotId={s.slot_id}
                fecha={fecha}
                disabled={mineHere || full}
              />
            </div>
          );
        })}
      </section>

      <section className="flex flex-col gap-3" aria-label="Mis turnos">
        <h2 className="text-lg font-medium">Mis turnos</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no tienes turnos reservados.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {mine.map((b) => (
              <li
                key={b.id}
                className="flex justify-between rounded-lg border p-3 text-sm"
              >
                <span>
                  {b.time_slots
                    ? `${b.time_slots.slot_date} · ${formatTime(b.time_slots.start_time)} - ${formatTime(b.time_slots.end_time)} · Andén ${b.time_slots.dock}`
                    : "Franja"}{" "}
                  · Placa {b.plate}
                </span>
                <span
                  className={
                    b.status === "confirmado"
                      ? "text-green-700"
                      : "text-muted-foreground"
                  }
                >
                  {b.status === "confirmado" ? "Confirmado" : "Cancelado"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
