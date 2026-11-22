import { redirect } from "next/navigation";
import { cache } from "react";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

/** Devuelve el perfil de la sesión actual, o null si no hay sesión o configuración. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (!getSupabaseEnv()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});

/** Exige uno de los roles: sin sesión redirige a /login y con otro rol a /. */
export async function requireRole(roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!roles.includes(profile.role)) {
    redirect("/");
  }

  return profile;
}
