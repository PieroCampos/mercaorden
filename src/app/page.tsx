import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";

const BENEFICIOS = [
  {
    titulo: "Registro formal",
    descripcion: "Comerciantes identificados y aprobados por la administración municipal.",
  },
  {
    titulo: "Turno garantizado",
    descripcion: "Ingreso vehicular por franja y andén para reducir el caos en los accesos.",
  },
  {
    titulo: "Gestión ordenada",
    descripcion: "Información centralizada para supervisar la operación diaria del mercado.",
  },
];

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          {profile?.full_name ? `Hola, ${profile.full_name}` : "Ordenemos juntos La Parada"}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          MercaOrden es la plataforma web que ayuda a formalizar y ordenar el mercado mayorista de
          La Parada, con incentivos claros para quienes trabajan en él.
        </p>
        {profile ? (
          <p className="text-sm">
            Estado de tu cuenta: <strong>{profile.status}</strong>
          </p>
        ) : (
          <div>
            <Link href="/registro" className={buttonVariants()}>
              Crear cuenta
            </Link>
          </div>
        )}
      </section>

      <section aria-label="Beneficios" className="grid gap-4 md:grid-cols-3">
        {BENEFICIOS.map((beneficio) => (
          <Card key={beneficio.titulo}>
            <CardHeader>
              <CardTitle>{beneficio.titulo}</CardTitle>
              <CardDescription>{beneficio.descripcion}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
