import { aprobarSolicitud, rechazarSolicitud } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLimaDate, groupSlots, MOTIVO_MAX, MOTIVO_MIN, type RawSlot } from "@/lib/admin";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ error?: string; ok?: string }>;

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
  }).format(new Date(iso));
}

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  await requireRole(["admin"]);
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const hoy = getLimaDate();

  const [pendientesRes, franjasRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, doc_number, business_name, business_type, created_at")
      .eq("role", "comerciante")
      .eq("status", "pendiente")
      .order("created_at", { ascending: true }),
    supabase
      .from("time_slots")
      .select(
        "id, start_time, end_time, dock, capacity, bookings(id, plate, status, profiles(full_name))",
      )
      .eq("slot_date", hoy),
  ]);

  const pendientes = (pendientesRes.data ?? []) as Pick<
    Profile,
    "id" | "full_name" | "doc_number" | "business_name" | "business_type" | "created_at"
  >[];
  const franjas = groupSlots((franjasRes.data ?? []) as unknown as RawSlot[]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">Panel de administración</h1>

      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="rounded-lg border p-3 text-sm">
          Solicitud {ok === "aprobado" ? "aprobada" : "rechazada"} correctamente.
        </p>
      ) : null}
      {pendientesRes.error || franjasRes.error ? (
        <p role="alert" className="text-sm text-destructive">
          No se pudieron cargar algunos datos. Recarga la página.
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Solicitudes pendientes ({pendientes.length})</h2>
        {pendientes.length === 0 ? (
          <p className="text-muted-foreground">No hay solicitudes pendientes.</p>
        ) : (
          pendientes.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle>{p.full_name ?? "Sin nombre"}</CardTitle>
                <CardDescription>
                  Documento: {p.doc_number ?? "-"} · Negocio: {p.business_name ?? "-"} · Giro:{" "}
                  {p.business_type ?? "-"} · Registrado: {formatDate(p.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <form action={aprobarSolicitud}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button type="submit">Aprobar</Button>
                </form>
                <form action={rechazarSolicitud} className="flex flex-1 flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={p.id} />
                  <label className="sr-only" htmlFor={`motivo-${p.id}`}>
                    Motivo del rechazo
                  </label>
                  <input
                    id={`motivo-${p.id}`}
                    name="motivo"
                    required
                    minLength={MOTIVO_MIN}
                    maxLength={MOTIVO_MAX}
                    placeholder="Motivo del rechazo"
                    className="h-8 flex-1 rounded-lg border bg-background px-2.5 text-sm"
                  />
                  <Button type="submit" variant="destructive">
                    Rechazar
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Turnos de hoy ({hoy})</h2>
        {franjas.length === 0 ? (
          <p className="text-muted-foreground">No hay franjas programadas para hoy.</p>
        ) : (
          franjas.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle>
                  {f.start} - {f.end} · Andén {f.dock}
                </CardTitle>
                <CardDescription>
                  Ocupados: {f.occupied}/{f.capacity}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {f.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin turnos reservados.</p>
                ) : (
                  <ul className="flex flex-col gap-1 text-sm">
                    {f.bookings.map((b) => (
                      <li key={b.id}>
                        <strong>{b.plate}</strong> · {b.carrier}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
