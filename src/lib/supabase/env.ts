export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Lee la configuración en el momento de usarla, para que el build no dependa
 * de las variables. Devuelve null si falta alguna.
 * Next.js solo expone NEXT_PUBLIC_* al navegador con acceso directo por nombre.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseEnv(): SupabaseEnv {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Revisa .env.example.",
    );
  }

  return env;
}
