import Link from "next/link";
import { RegistroForm } from "@/app/registro/registro-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Registro | MercaOrden" };

export default function RegistroPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Crea tu cuenta</CardTitle>
          <CardDescription>
            Los comerciantes inician en estado pendiente hasta que un administrador apruebe su cuenta. Los transportistas quedan aprobados al registrarse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RegistroForm />
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="underline">
              Ingresar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}