import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import type { ApprovalStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi panel | MercaOrden" };

const ESTADOS: Record<ApprovalStatus, { texto: string; variante: "secondary" | "default" | "destructive" }> = {
  pendiente: { texto: "Pendiente de aprobación", variante: "secondary" },
  aprobado: { texto: "Aprobado", variante: "default" },
  rechazado: { texto: "Rechazado", variante: "destructive" },
};

export default async function PanelPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const estado = ESTADOS[profile.status];
  const datos: [string, string][] = [
    ["Nombre", profile.full_name ?? "-"],
    ["Negocio", profile.business_name ?? "-"],
    ["Giro", profile.business_type ?? "-"],
    ["Documento", profile.doc_number ?? "-"],
    ["Rol", profile.role],
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Mi panel</CardTitle>
          <CardDescription>Datos de tu cuenta y estado de aprobación.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-[8rem_1fr] gap-2 text-sm">
            {datos.map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd>{val}</dd>
              </div>
            ))}
            <dt className="text-muted-foreground">Estado</dt>
            <dd>
              <Badge variant={estado.variante}>{estado.texto}</Badge>
            </dd>
          </dl>

          {profile.status === "rechazado" && profile.rejection_reason ? (
            <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Motivo del rechazo: {profile.rejection_reason}
            </p>
          ) : null}
          {profile.status === "pendiente" ? (
            <p className="text-sm text-muted-foreground">
              Un administrador revisará tu cuenta. Podrás reservar turnos cuando sea aprobada.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {profile.role === "transportista" ? (
              <Link href="/turnos" className={buttonVariants()}>
                Ir a turnos
              </Link>
            ) : null}
            {profile.role === "admin" ? (
              <Link href="/admin" className={buttonVariants()}>
                Ir a administración
              </Link>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}