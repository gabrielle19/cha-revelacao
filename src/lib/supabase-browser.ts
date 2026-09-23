import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase para uso no NAVEGADOR, com a chave pública (anon).
 * É normal (e esperado) que essa chave apareça no código do cliente — a
 * segurança fica 100% a cargo das regras (RLS) do Postgres.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
