import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Ingresar | MercaOrden" };

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Ingresar</CardTitle>
          <CardDescription>Accede a tu panel de MercaOrden.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="underline">
              Registrarse
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}