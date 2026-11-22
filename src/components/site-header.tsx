import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getNavLinks } from "@/lib/navigation";
import type { Profile } from "@/lib/types";

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const links = getNavLinks(profile?.role ?? null);

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          MercaOrden
        </Link>
        <nav aria-label="Navegación principal" className="flex flex-wrap items-center gap-4 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:underline">
              {link.label}
            </Link>
          ))}
          {profile ? <Badge variant="secondary">{profile.role}</Badge> : null}
        </nav>
      </div>
    </header>
  );
}
