import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { getCurrentProfile } from "@/lib/auth";
import "./globals.css";

// La navegación depende de la sesión de cada petición.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "MercaOrden",
  description: "Plataforma web para ordenar el mercado mayorista de La Parada",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader profile={profile} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
